// src/components/reports/FiltersBar.jsx
import React from "react";
import { Box, TextField, MenuItem, Button } from "@mui/material";

export default function FiltersBar({
  reportOptions = [],
  reportType,
  setReportType,
  filters,
  onFiltersChange,
  onGenerate,
  loading,
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
      <TextField
        select
        size="small"
        label="Report"
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        sx={{ minWidth: 220 }}
      >
        {reportOptions.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        name="region"
        size="small"
        label="Region"
        value={filters.region || ""}
        onChange={(e) => onFiltersChange({ region: e.target.value })}
      />

      <TextField
        name="territory"
        size="small"
        label="Territory"
        value={filters.territory || ""}
        onChange={(e) => onFiltersChange({ territory: e.target.value })}
      />

      <TextField
        name="dealerId"
        size="small"
        label="Dealer ID"
        value={filters.dealerId || ""}
        onChange={(e) => onFiltersChange({ dealerId: e.target.value })}
      />

      <TextField
        name="startDate"
        type="date"
        size="small"
        label="From"
        InputLabelProps={{ shrink: true }}
        value={filters.startDate || ""}
        onChange={(e) => onFiltersChange({ startDate: e.target.value })}
      />

      <TextField
        name="endDate"
        type="date"
        size="small"
        label="To"
        InputLabelProps={{ shrink: true }}
        value={filters.endDate || ""}
        onChange={(e) => onFiltersChange({ endDate: e.target.value })}
      />

      <Button variant="contained" sx={{ background: "#F97316" }} onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </Button>
    </Box>
  );
}
