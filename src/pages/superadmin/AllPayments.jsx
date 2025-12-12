import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Chip,
} from "@mui/material";
import { Search, Download } from "lucide-react";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";

export default function AllPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentAPI.getAllPayments();
      setPayments(Array.isArray(data) ? data : data.payments || data.data || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) =>
    payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.dealer?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Payments"
        subtitle="View and manage all payment requests across the system"
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
        endpoint="/payments"
        columns={columns}
        title="Payments"
        data={filteredPayments}
        loading={loading}
      />
    </Box>
  );
}

