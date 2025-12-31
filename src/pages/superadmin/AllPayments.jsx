import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Alert,
  Typography,
} from "@mui/material";
import { Search, Download, Filter } from "lucide-react";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import AdvancedFilterSidebar from "../../components/AdvancedFilterSidebar";
import FilterChips from "../../components/FilterChips";
import { useDebounce } from "../../hooks/useDebounce";

export default function AllPayments() {
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    paymentMode: "",
    createdAt_from: "",
    createdAt_to: "",
    amount_min: "",
    amount_max: "",
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filterConfig = [
    {
      category: "Payment Details",
      fields: [
        {
          id: "paymentMode",
          label: "Payment Mode",
          type: "select",
          options: [
            { label: "NEFT", value: "NEFT" },
            { label: "RTGS", value: "RTGS" },
            { label: "UPI", value: "UPI" },
            { label: "Bank Transfer", value: "BANK_TRANSFER" },
            { label: "Cheque", value: "CHEQUE" },
            { label: "Cash", value: "CASH" },
          ]
        },
      ],
    },
    {
      category: "Amount Range",
      fields: [
        { id: "amount_min", label: "Min Amount", type: "number" },
        { id: "amount_max", label: "Max Amount", type: "number" },
      ],
    },
    {
      category: "Timeline",
      fields: [
        { id: "createdAt_from", label: "From Date", type: "date" },
        { id: "createdAt_to", label: "To Date", type: "date" },
      ],
    },
  ];

  const handleRemoveFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      paymentMode: "",
      createdAt_from: "",
      createdAt_to: "",
      amount_min: "",
      amount_max: "",
    });
  };

  const columns = [
    { field: "invoiceNumber", headerName: "Invoice #", flex: 0.8 },
    { field: "dealerName", headerName: "Dealer", flex: 1.2, renderCell: (params) => params.row.dealer?.businessName || "N/A" },
    { field: "region", headerName: "Region", flex: 0.8, renderCell: (params) => params.row.dealer?.region?.name || "N/A" },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.8,
      renderCell: (params) => `₹${Number(params.value || 0).toLocaleString()}`,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      renderCell: (params) => {
        const status = params.value || "pending";
        const colorMap = {
          approved: "success",
          rejected: "error",
          pending: "warning",
          reconciled: "info",
        };
        return <Chip label={status.toUpperCase()} color={colorMap[status] || "default"} size="small" />;
      },
    },
    {
      field: "createdAt",
      headerName: "Date",
      flex: 0.8,
      renderCell: (params) => (params.value ? new Date(params.value).toLocaleDateString() : "N/A"),
    },
  ];

  const handleExport = () => {
    toast.info("Exporting data...");
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Payments"
        subtitle="View and manage all payment requests across the system"
        action={
          <Button variant="outlined" startIcon={<Download size={18} />} onClick={handleExport}>
            Export
          </Button>
        }
      />

      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by invoice number, dealer or UTR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            onClick={() => setFilterDrawerOpen(true)}
            startIcon={<Filter size={18} />}
            sx={{ minWidth: 160 }}
          >
            Filters
          </Button>
        </Box>

        <FilterChips
          filters={filters}
          config={filterConfig}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            This view shows all payments in the system. Use filters to narrow down by status, amount, or date.
          </Typography>
        </Alert>

        <ScopedDataTable
          fetchFn={paymentAPI.getFinancePending} // Finance pending shows all payments in scope for admin
          columns={columns}
          title="All Payments"
          filters={filters}
          search={debouncedSearch}
        />
      </Box>

      <AdvancedFilterSidebar
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onClear={handleClearAllFilters}
        config={filterConfig}
      />
    </Box>
  );
}
