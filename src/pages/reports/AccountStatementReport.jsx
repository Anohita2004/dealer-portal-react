import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";

const KPI = { p: 2, borderRadius: 2, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" };
const ACCENT = "#0d6efd";

export default function AccountStatementReport({ data, loading, error, fetchReport, filters }) {
  useEffect(() => { if (!data) fetchReport(); }, []); // eslint-disable-line

  if (loading) return <Box sx={{ mt: 3, textAlign: "center" }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 3 }}><Typography color="error">{error}</Typography></Box>;
  if (!data) return null;

  const { openingBalance = 0, closingBalance = 0, totalDebit = 0, totalCredit = 0, statements = [] } = data;

  return (
    <Box mt={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={KPI}>
            <Typography variant="subtitle2" color={ACCENT}>Opening Balance</Typography>
            <Typography variant="h6" fontWeight={700}>₹{Number(openingBalance).toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={KPI}>
            <Typography variant="subtitle2" color={ACCENT}>Closing Balance</Typography>
            <Typography variant="h6" fontWeight={700}>₹{Number(closingBalance).toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={KPI}>
            <Typography variant="subtitle2" color={ACCENT}>Total Debit</Typography>
            <Typography variant="h6" fontWeight={700}>₹{Number(totalDebit).toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={KPI}>
            <Typography variant="subtitle2" color={ACCENT}>Total Credit</Typography>
            <Typography variant="h6" fontWeight={700}>₹{Number(totalCredit).toLocaleString()}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Statements</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f3f4f6" }}>
                  <tr>
                    <th style={{ padding: 10 }}>Date</th>
                    <th style={{ padding: 10 }}>Description</th>
                    <th style={{ padding: 10 }}>Debit</th>
                    <th style={{ padding: 10 }}>Credit</th>
                    <th style={{ padding: 10 }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map(s => (
                    <tr key={s.id}>
                      <td style={{ padding: 10 }}>{new Date(s.statementDate).toLocaleDateString()}</td>
                      <td style={{ padding: 10 }}>{s.description || s.documentType || "—"}</td>
                      <td style={{ padding: 10 }}>₹{Number(s.debitAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: 10 }}>₹{Number(s.creditAmount || 0).toLocaleString()}</td>
                      <td style={{ padding: 10 }}>₹{Number(s.balance || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
