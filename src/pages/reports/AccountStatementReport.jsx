import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  Alert,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { getReportScopeExplanation, formatAppliedFilters, getDataFreshness } from "../../utils/reportScope";
import { Info, RefreshCw, Filter } from "lucide-react";

const KPI = { p: 2, borderRadius: 2, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" };
const ACCENT = "#0d6efd";

export default function AccountStatementReport({ data, loading, error, fetchReport, filters, role }) {
  const { user } = useAuth();
  const [dataFetchedAt, setDataFetchedAt] = useState(null);

  useEffect(() => { 
    if (!data) {
      fetchReport();
    } else {
      setDataFetchedAt(new Date().toISOString());
    }
  }, [data]); // eslint-disable-line

  // Get scope explanation
  const scopeExplanation = getReportScopeExplanation(user);
  
  // Get applied filters
  const appliedFilters = formatAppliedFilters(filters);
  
  // Get data freshness
  const dataFreshness = getDataFreshness(data, dataFetchedAt);

  if (loading) return <Box sx={{ mt: 3, textAlign: "center" }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 3 }}><Typography color="error">{error}</Typography></Box>;
  if (!data) return null;

  // Handle different response formats
  const openingBalance = data.openingBalance || data.opening || 0;
  const closingBalance = data.closingBalance || data.closing || 0;
  const totalDebit = data.totalDebit || data.debit || 0;
  const totalCredit = data.totalCredit || data.credit || 0;
  const statements = Array.isArray(data.statements) 
    ? data.statements 
    : Array.isArray(data.transactions)
    ? data.transactions
    : Array.isArray(data.data)
    ? data.data
    : [];

  return (
    <Box mt={3}>
      {/* Role-Based Scope Explanation - Backend Intelligence */}
      <Alert severity="info" icon={<Info size={18} />} sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Report Scope: {scopeExplanation.scope}
        </Typography>
        <Typography variant="caption">
          {scopeExplanation.explanation}
        </Typography>
      </Alert>

      {/* Applied Filters - Backend Intelligence */}
      {appliedFilters.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Filter size={16} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Applied Filters:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {appliedFilters.map((filter, idx) => (
              <Chip
                key={idx}
                label={`${filter.label}: ${filter.value}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Data Freshness Indicator - Backend Intelligence */}
      {dataFetchedAt && (
        <Alert 
          severity={dataFreshness.color === "success" ? "success" : dataFreshness.color === "warning" ? "warning" : "error"}
          icon={<RefreshCw size={18} />}
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => fetchReport()}>
              Refresh
            </Button>
          }
        >
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
            Data Freshness: {dataFreshness.label}
          </Typography>
          <Typography variant="caption">
            {dataFreshness.description}
          </Typography>
        </Alert>
      )}

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
