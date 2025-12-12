import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
} from "@mui/material";
import { Search, Download } from "lucide-react";
import { invoiceAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";

export default function AllInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceAPI.getInvoices();
      setInvoices(Array.isArray(data) ? data : data.invoices || data.data || []);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.dealer?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Invoices"
        subtitle="View and manage all invoices across the system"
        action={
          <Button variant="outlined" startIcon={<Download size={18} />}>
            Export
          </Button>
        }
      />

      <Box sx={{ mt: 3, mb: 2 }}>
        <TextField
          fullWidth
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
      </Box>

      <ScopedDataTable
        endpoint="/invoices"
        columns={columns}
        title="Invoices"
        data={filteredInvoices}
        loading={loading}
      />
    </Box>
  );
}

