import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Eye, FileText, Download, Lock, Search, Filter } from "lucide-react";
import { invoiceAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { isAccountsUser, getDisabledActionExplanation } from "../../utils/accountsPermissions";
import { useWorkflow } from "../../hooks/useWorkflow";
import { WorkflowTimeline } from "../../components/workflow";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import AdvancedFilterSidebar from "../../components/AdvancedFilterSidebar";
import FilterChips from "../../components/FilterChips";
import { useDebounce } from "../../hooks/useDebounce";

export default function AccountsInvoices() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const handleViewDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailOpen(true);
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const response = await invoiceAPI.downloadInvoicePDF(invoice.id);
      const url = window.URL.createObjectURL(new Blob([response]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      a.click();
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  const columns = [
    { field: "invoiceNumber", headerName: "Invoice #", flex: 0.8 },
    {
      field: "invoiceDate",
      headerName: "Date",
      flex: 0.8,
      renderCell: (params) => (params.value ? new Date(params.value).toLocaleDateString() : "N/A"),
    },
    { field: "dealerName", headerName: "Dealer", flex: 1.2, renderCell: (params) => params.row.dealer?.businessName || params.row.dealerName || "N/A" },
    {
      field: "totalAmount",
      headerName: "Total (₹)",
      flex: 0.8,
      renderCell: (params) => `₹${Number(params.value || 0).toLocaleString()}`,
    },
    {
      field: "paidAmount",
      headerName: "Paid (₹)",
      flex: 0.8,
      renderCell: (params) => `₹${Number(params.value || 0).toLocaleString()}`,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      renderCell: (params) => {
        const status = params.value || "pending";
        const colorMap = {
          approved: "success",
          paid: "success",
          rejected: "error",
          pending: "warning",
          partial: "info",
        };
        return <Chip label={status.toUpperCase()} color={colorMap[status] || "default"} size="small" />;
      },
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
            startIcon={<Eye size={16} />}
            onClick={() => handleViewDetail(params.row)}
          >
            View
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={() => handleDownloadPDF(params.row)}
          >
            PDF
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Invoices"
        subtitle="View all invoices in read-only mode for reconciliation."
      />

      {isAccountsUser(user) && (
        <Alert severity="info" icon={<Lock size={20} />} sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Read-Only Access
          </Typography>
          <Typography variant="body2">
            {getDisabledActionExplanation(user, "edit_invoices")}
          </Typography>
        </Alert>
      )}

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
          fetchFn={async (params) => {
            const res = await api.get("/accounts/invoices", { params });
            return {
              data: res.data.invoices || res.data || [],
              total: res.data.total || (res.data.invoices ? res.data.invoices.length : res.data.length) || 0,
            };
          }}
          columns={columns}
          title="Invoices"
          filters={filters}
          search={debouncedSearch}
        />
      </Box>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FileText size={20} />
            Invoice Details
            {selectedInvoice && (
              <Chip
                label={selectedInvoice.invoiceNumber || `#${selectedInvoice.id?.slice(0, 8)}`}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && <InvoiceDetailView invoice={selectedInvoice} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

function InvoiceDetailView({ invoice }) {
  const { workflow } = useWorkflow("invoice", invoice.id);
  const outstanding = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 3, mb: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="overline" color="text.secondary">Financials</Typography>
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Total Amount</Typography>
                <Typography variant="body2" fontWeight="bold">₹{Number(invoice.totalAmount || 0).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Paid Amount</Typography>
                <Typography variant="body2" color="success.main" fontWeight="bold">₹{Number(invoice.paidAmount || 0).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Outstanding</Typography>
                <Typography variant="body2" color={outstanding > 0 ? "error.main" : "success.main"} fontWeight="bold">₹{outstanding.toLocaleString()}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="overline" color="text.secondary">Entity Details</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">{invoice.dealer?.businessName || invoice.dealerName || "N/A"}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">Dealer</Typography>
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}</Typography>
                <Typography variant="caption" color="text.secondary">Invoice Date</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {workflow && workflow.timeline && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Audit Trail</Typography>
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <WorkflowTimeline timeline={workflow.timeline} workflow={workflow} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
