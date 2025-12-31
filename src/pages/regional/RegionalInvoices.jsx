import React, { useState } from "react";
import {
  Box,
  Chip,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search, Filter, Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { invoiceAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import AdvancedFilterSidebar from "../../components/AdvancedFilterSidebar";
import FilterChips from "../../components/FilterChips";
import { useDebounce } from "../../hooks/useDebounce";

export default function RegionalInvoices() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
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
            { label: "Approved", value: "approved" },
            { label: "Pending", value: "pending" },
            { label: "Paid", value: "paid" },
            { label: "Rejected", value: "rejected" },
          ],
        },
      ],
    },
    {
      category: "Amount Range",
      fields: [
        { id: "totalAmount_min", label: "Min Amount", type: "number" },
        { id: "totalAmount_max", label: "Max Amount", type: "number" },
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

  const handleDownloadPDF = async (id) => {
    try {
      const res = await invoiceAPI.downloadInvoicePDF(id);
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success("Download started");
    } catch (err) {
      toast.error("Download failed");
    }
  };

  const columns = [
    { field: "invoiceNumber", headerName: "Invoice #", flex: 1 },
    {
      field: "dealerName",
      headerName: "Dealer",
      flex: 1.5,
      renderCell: (params) => params.row.dealer?.businessName || params.row.dealerName || "N/A"
    },
    {
      field: "totalAmount",
      headerName: "Total Amount",
      flex: 1,
      renderCell: (params) => `₹${Number(params.value || params.row.baseAmount || 0).toLocaleString()}`
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const val = params.value || "pending";
        return (
          <Chip
            label={val.toUpperCase()}
            size="small"
            color={
              val === "approved" || val === "paid"
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
      field: "invoiceDate",
      headerName: "Date",
      flex: 1,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : "N/A"
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/invoices/${params.row.id}`)}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleDownloadPDF(params.row.id)}
          >
            <Download size={16} />
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Invoices"
        subtitle="View and monitor all invoices in your region"
      />

      <Box sx={{ mt: 3, display: "flex", gap: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by invoice # or dealer..."
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
        title="Region Invoices"
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
