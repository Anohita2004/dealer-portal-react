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
import { Search, Download } from "lucide-react";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import { useAuth } from "../../context/AuthContext";

export default function AllPayments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch function for ScopedDataTable - uses workflow-based endpoint
  // Super Admin should use finance pending endpoint to see all payments in workflow
  const fetchPaymentsFn = async ({ page, limit }) => {
    try {
      // For Super Admin, use finance pending endpoint which shows all payments in workflow
      const data = await paymentAPI.getFinancePending();
      const paymentsList = Array.isArray(data) ? data : data.payments || data.data || [];
      
      // Apply client-side pagination if needed
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = paymentsList.slice(start, end);
      
      return {
        data: paginated,
        total: paymentsList.length,
      };
    } catch (error) {
      // 404 = endpoint doesn't exist - return empty
      // 403 = role restriction - return empty
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return { data: [], total: 0 };
      }
      throw error;
    }
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

      {/* Note: Payments are workflow-driven. Super Admin sees all payments via finance pending endpoint */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Payments are workflow-driven and role-scoped. This view shows all payments currently in the finance approval workflow.
        </Typography>
      </Alert>

      <ScopedDataTable
        fetchFn={fetchPaymentsFn}
        columns={columns}
        title="All Payments (Workflow View)"
      />
    </Box>
  );
}

