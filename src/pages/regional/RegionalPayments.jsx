import React, { useState } from "react";
import {
  Box,
  Chip,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search, Filter, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { paymentAPI } from "../../services/api";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import AdvancedFilterSidebar from "../../components/AdvancedFilterSidebar";
import FilterChips from "../../components/FilterChips";
import { useDebounce } from "../../hooks/useDebounce";

export default function RegionalPayments() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    paymentMode: "",
    status: [],
    amount_min: "",
    amount_max: "",
    createdAt_from: "",
    createdAt_to: "",
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
          ]
        },
        {
          id: "status",
          label: "Status",
          type: "multi-select",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Reconciled", value: "reconciled" },
          ],
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
      paymentMode: "",
      status: [],
      amount_min: "",
      amount_max: "",
      createdAt_from: "",
      createdAt_to: "",
    });
  };

  const columns = [
    { field: "id", headerName: "Payment ID", flex: 0.8, renderCell: (params) => `#${params.value?.slice(0, 8)}` },
    {
      field: "dealerName",
      headerName: "Dealer",
      flex: 1.2,
      renderCell: (params) => params.row.dealer?.businessName || params.row.dealerName || "N/A"
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.8,
      renderCell: (params) => `₹${Number(params.value || 0).toLocaleString()}`
    },
    { field: "paymentMode", headerName: "Mode", flex: 0.7 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      renderCell: (params) => {
        const val = params.value || params.row.approvalStatus || "pending";
        return (
          <Chip
            label={val.toUpperCase()}
            size="small"
            color={
              val === "approved" || val === "reconciled"
                ? "success"
                : val === "rejected"
                  ? "error"
                  : "warning"
            }
          />
        );
      }
    },
    {
      field: "createdAt",
      headerName: "Date",
      flex: 0.8,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : "N/A"
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.6,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate(`/payments/${params.row.id}`)}
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Payments"
        subtitle="Monitor payment requests within your region"
      />

      <Box sx={{ mt: 3, display: "flex", gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by ID or dealer..."
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
        fetchFn={paymentAPI.getFinancePending} // Use finance pending as it typically has the broadest scope for managers
        columns={columns}
        title="Region Payments"
        filters={filters}
        search={debouncedSearch}
      />

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
