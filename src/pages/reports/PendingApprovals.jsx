// src/pages/reports/PendingApprovals.jsx
import React from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const CARD = {
  p: 3,
  borderRadius: "16px",
  background: "white",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
};

export default function PendingApprovals({ data, loading, error }) {
  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );

  if (error)
    return (
      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  // 👇 FIX HERE
  const list = Array.isArray(data?.report) ? data.report : [];

  if (list.length === 0)
    return (
      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Typography>No pending approvals found.</Typography>
      </Box>
    );

  // ----- KPIs -----
  const pendingCount = list.length;
  const typesBreakdown = {};

  list.forEach((d) => {
    if (!typesBreakdown[d.documentType]) typesBreakdown[d.documentType] = 0;
    typesBreakdown[d.documentType]++;
  });

  return (
    <Box mt={3}>
      {/* ===================== KPI CARDS ===================== */}
      <Grid container spacing={3}>
        {/* Pending Approvals */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              ...CARD,
              background: "linear-gradient(135deg, #f97316, #c2410c)",
              color: "white",
            }}
          >
            <Typography variant="subtitle2">Total Pending Approvals</Typography>
            <Typography variant="h4" fontWeight={700}>
              {pendingCount}
            </Typography>
          </Paper>
        </Grid>

        {/* Document Type-wise */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...CARD }}>
            <Typography variant="subtitle2" color="text.secondary">
              Pending by Document Type
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              {Object.entries(typesBreakdown).map(([type, count]) => (
                <Chip
                  key={type}
                  label={`${type} — ${count}`}
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ===================== DATA ACCORDION TABLE ===================== */}
      <Box mt={3}>
        <Paper sx={{ ...CARD }}>
          <Typography variant="h6" mb={2}>
            Pending Documents
          </Typography>

          {list.map((item, index) => (
            <Accordion key={index} sx={{ mb: 1, borderRadius: "12px" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Typography fontWeight={600}>{item.dealerName}</Typography>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Typography>{item.documentType}</Typography>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Typography color="gray">
                      Submitted: {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <Chip
                      icon={<HourglassEmptyIcon />}
                      label="Pending"
                      color="warning"
                    />
                  </Grid>
                </Grid>
              </AccordionSummary>

              <AccordionDetails>
                {/* TIMELINE UI */}
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    Approval Timeline
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography fontSize={14}>Submitted by Dealer</Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <HourglassEmptyIcon color="warning" fontSize="small" />
                      <Typography fontSize={14}>
                        Awaiting Manager Review
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <ErrorIcon color="disabled" fontSize="small" />
                      <Typography fontSize={14} color="text.secondary">
                        Pending Higher-Level Approval
                      </Typography>
                    </Box>
                  </Box>

                  {/* Dealer Info */}
                  <Box mt={2}>
                    <Typography variant="subtitle2">Dealer Info</Typography>
                    <Typography fontSize={14}>
                      Dealer ID: {item.dealerId}
                    </Typography>
                    <Typography fontSize={14}>
                      Dealer Name: {item.dealerName}
                    </Typography>
                    <Typography fontSize={14}>
                      Document Type: {item.documentType}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      </Box>
    </Box>
  );
}
