import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Search, Download, Filter } from "lucide-react";
import { orderAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, regionFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (regionFilter !== "all") params.regionId = regionFilter;
      
      const data = await orderAPI.getAllOrders(params);
      setOrders(Array.isArray(data) ? data : data.orders || data.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.dealer?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Orders"
        subtitle="View and manage all orders across the system"
        action={
          <Button variant="outlined" startIcon={<Download size={18} />}>
            Export
          </Button>
        }
      />

      <Box sx={{ mt: 3, display: "flex", gap: 2, mb: 2 }}>
        <TextField
          fullWidth
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
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <ScopedDataTable
        endpoint="/orders"
        columns={columns}
        title="Orders"
        data={filteredOrders}
        loading={loading}
      />
    </Box>
  );
}

