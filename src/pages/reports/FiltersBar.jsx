import React, { useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Popover,
  Badge,
  alpha,
  useTheme
} from "@mui/material";
import { Filter, X, Play, RotateCcw, Calendar } from "lucide-react";

export default function FiltersBar({
  reportOptions = [],
  reportType,
  setReportType,
  filters,
  onFiltersChange,
  onGenerate,
  loading,
}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  const activeFilterCount = Object.values(filters).filter(v => v !== "").length;

  const clearFilters = () => {
    onFiltersChange({
      region: "",
      territory: "",
      dealerId: "",
      startDate: "",
      endDate: "",
    });
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip title="Filter Options">
        <Button
          variant="outlined"
          onClick={handleOpen}
          startIcon={<Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16 } }}><Filter size={18} /></Badge>}
          sx={{
            borderRadius: 3,
            borderColor: 'divider',
            color: 'text.primary',
            textTransform: 'none',
            px: 2,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
          }}
        >
          Filters
        </Button>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 3,
            width: 320,
            borderRadius: 4,
            mt: 1.5,
            boxShadow: `0 20px 40px -10px ${alpha(theme.palette.common.black, 0.15)}`,
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Stack spacing={2.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ fontWeight: 800 }}>Configuration</Box>
            <IconButton size="small" onClick={clearFilters} color="error">
              <RotateCcw size={16} />
            </IconButton>
          </Box>

          <TextField
            name="dealerId"
            size="small"
            label="Dealer Identifier"
            fullWidth
            value={filters.dealerId || ""}
            onChange={(e) => onFiltersChange({ dealerId: e.target.value })}
            InputProps={{ sx: { borderRadius: 3 } }}
          />

          <Stack direction="row" spacing={1.5}>
            <TextField
              name="region"
              size="small"
              label="Region"
              fullWidth
              value={filters.region || ""}
              onChange={(e) => onFiltersChange({ region: e.target.value })}
              InputProps={{ sx: { borderRadius: 3 } }}
            />
            <TextField
              name="territory"
              size="small"
              label="Territory"
              fullWidth
              value={filters.territory || ""}
              onChange={(e) => onFiltersChange({ territory: e.target.value })}
              InputProps={{ sx: { borderRadius: 3 } }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <TextField
              name="startDate"
              type="date"
              size="small"
              label="Start Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.startDate || ""}
              onChange={(e) => onFiltersChange({ startDate: e.target.value })}
              InputProps={{ sx: { borderRadius: 3 } }}
            />
            <TextField
              name="endDate"
              type="date"
              size="small"
              label="End Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.endDate || ""}
              onChange={(e) => onFiltersChange({ endDate: e.target.value })}
              InputProps={{ sx: { borderRadius: 3 } }}
            />
          </Stack>

          <Button
            variant="contained"
            fullWidth
            onClick={() => { handleClose(); onGenerate(); }}
            disabled={loading}
            sx={{ borderRadius: 3, py: 1.5, fontWeight: 800 }}
          >
            Apply Logic
          </Button>
        </Stack>
      </Popover>

      <Button
        variant="contained"
        onClick={onGenerate}
        disabled={loading}
        startIcon={loading ? null : <Play size={18} />}
        sx={{
          borderRadius: 3,
          px: 3,
          boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.4)}`,
          fontWeight: 800
        }}
      >
        {loading ? "Processing..." : "Generate"}
      </Button>
    </Stack>
  );
}
