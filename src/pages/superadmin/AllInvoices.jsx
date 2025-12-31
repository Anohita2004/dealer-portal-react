import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Chip,
} from "@mui/material";
import { Search, Download, Filter } from "lucide-react";
import { invoiceAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import AdvancedFilterSidebar from "../../components/AdvancedFilterSidebar";
import FilterChips from "../../components/FilterChips";
import { useDebounce } from "../../hooks/useDebounce";

export default function AllInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Advanced Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    totalAmount_min: "",
    totalAmount_max: "",
    invoiceDate_from: "",
    invoiceDate_to: "",
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filterConfig = [
    {
      category: "Status",
      fields: [
        {
          id: "status",
          label: "Invoice Status",
          type: "multi-select",
          options: [
            { label: "Paid", value: "paid" },
            { label: "Unpaid", value: "unpaid" },
            { label: "Pending", value: "pending" },
            { label: "Partial", value: "partial" },
            { label: "Approved", value: "approved" },
          ],
        },
      ],
    },
    {
      category: "Amount Range",
      fields: [
        { id: "totalAmount_min", label: "Min Total Amount", type: "number" },
        { id: "totalAmount_max", label: "Max Total Amount", type: "number" },
      ],
    },
    {
      category: "Timeline",
      fields: [
        { id: "invoiceDate_from", label: "From Date", type: "date" },
        { id: "invoiceDate_to", label: "To Date", type: "date" },
      ],
    },
  ];

  const handleRemoveFilter = (key, value) => {
    setFilters((prev) => {
      if (Array.isArray(prev[key])) {
        return { ...prev, [key]: prev[key].filter((v) => v !== value) };
      }
      return { ...prev, [key]: "" };
    });
  };

  const handleClearAllFilters = () => {
    setFilters({
      status: [],
      totalAmount_min: "",
      totalAmount_max: "",
      invoiceDate_from: "",
      invoiceDate_to: "",
    });
  };

  const columns = [
    { field: "invoiceNumber", headerName: "Invoice #", flex: 0.8 },
    { field: "dealerName", headerName: "Dealer", flex: 1.2, renderCell: (params) => params.row.dealer?.businessName || "N/A" },
    { field: "region", headerName: "Region", flex: 0.8, renderCell: (params) => params.row.dealer?.region?.name || "N/A" },
    {
      field: "totalAmount",
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
          paid: "info",
        };
        return <Chip label={status.toUpperCase()} color={colorMap[status] || "default"} size="small" />;
      },
    },
    {
      field: "invoiceDate",
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
        title="All Invoices"
        subtitle="View and manage all invoices across the system"
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
            placeholder="Search by invoice number or dealer..."
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

        <ScopedDataTable
          fetchFn={invoiceAPI.getInvoices}
          columns={columns}
          title="Invoices"
          filters={filters}
          search={debouncedSearch}
          loading={loading}
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
