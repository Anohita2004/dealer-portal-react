import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material";
import { Search, Download, Filter } from "lucide-react";
import { orderAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import AdvancedFilterSidebar from "../../components/AdvancedFilterSidebar";
import FilterChips from "../../components/FilterChips";
import { useDebounce } from "../../hooks/useDebounce";
import { Chip } from "@mui/material";

export default function AllOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Advanced Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    totalAmount_min: "",
    totalAmount_max: "",
    createdAt_from: "",
    createdAt_to: "",
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filterConfig = [
    {
      category: "Status",
      fields: [
        {
          id: "status",
          label: "Order Status",
          type: "select",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Draft", value: "draft" },
          ]
        },
      ],
    },
    {
      category: "Financials",
      fields: [
        { id: "totalAmount_min", label: "Min Amount", type: "number" },
        { id: "totalAmount_max", label: "Max Amount", type: "number" },
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
      status: "",
      totalAmount_min: "",
      totalAmount_max: "",
      createdAt_from: "",
      createdAt_to: "",
    });
  };

  const columns = [
    { field: "orderNumber", headerName: "Order #", flex: 0.8 },
    { field: "dealerName", headerName: "Dealer", flex: 1.2, renderCell: (params) => params.row.dealer?.businessName || params.row.dealerName || "N/A" },
    { field: "region", headerName: "Region", flex: 0.8, renderCell: (params) => params.row.dealer?.region?.name || "N/A" },
    { field: "territory", headerName: "Territory", flex: 0.8, renderCell: (params) => params.row.dealer?.territory?.name || "N/A" },
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
        const status = params.value || params.row.approvalStatus || "pending";
        const colorMap = {
          approved: "success",
          rejected: "error",
          pending: "warning",
          draft: "default",
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
    // Future implementation: call export API
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Orders"
        subtitle="View and manage all orders across the system"
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
            placeholder="Search by order number or dealer..."
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
          fetchFn={orderAPI.getAllOrders}
          columns={columns}
          title="Orders"
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
