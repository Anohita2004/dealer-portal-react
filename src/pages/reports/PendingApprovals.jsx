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

  // Handle different response formats
  const list = Array.isArray(data) 
    ? data 
    : Array.isArray(data?.report) 
    ? data.report 
    : Array.isArray(data?.approvals)
    ? data.approvals
    : Array.isArray(data?.data)
    ? data.data
    : [];

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
    const type = d.documentType || d.type || d.entityType || "Unknown";
    if (!typesBreakdown[type]) typesBreakdown[type] = 0;
    typesBreakdown[type]++;
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
                    <Typography fontWeight={600}>{item.dealerName || item.dealer?.businessName || item.dealer?.name || "N/A"}</Typography>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Typography>{item.documentType || item.type || item.entityType || "N/A"}</Typography>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Typography color="gray">
                      Submitted: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
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
                    <Typography variant="subtitle2">Details</Typography>
                    <Typography fontSize={14}>
                      Dealer ID: {item.dealerId || item.dealer?.id || "N/A"}
                    </Typography>
                    <Typography fontSize={14}>
                      Dealer Name: {item.dealerName || item.dealer?.businessName || item.dealer?.name || "N/A"}
                    </Typography>
                    <Typography fontSize={14}>
                      Type: {item.documentType || item.type || item.entityType || "N/A"}
                    </Typography>
                    {item.stage && (
                      <Typography fontSize={14}>
                        Current Stage: {item.stage.replace("_", " ")}
                      </Typography>
                    )}
                    {item.title && (
                      <Typography fontSize={14}>
                        Title: {item.title}
                      </Typography>
                    )}
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
