import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { Search, Download, TrendingUp, DollarSign, Package } from "lucide-react";
import { dealerAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";

export default function AllDealers() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const data = await dealerAPI.getDealers();
      setDealers(Array.isArray(data) ? data : data.dealers || data.data || []);
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
      toast.error("Failed to load dealers");
    } finally {
      setLoading(false);
    }
  };

  const filteredDealers = dealers.filter((dealer) =>
    dealer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSales = dealers.reduce((sum, d) => sum + Number(d.totalSales || 0), 0);
  const totalOutstanding = dealers.reduce((sum, d) => sum + Number(d.outstanding || 0), 0);

  const columns = [
    { field: "businessName", headerName: "Business Name", flex: 1.5 },
    { field: "code", headerName: "Code", flex: 0.6 },
    { field: "region", headerName: "Region", flex: 0.8, renderCell: (params) => params.row.region?.name || "N/A" },
    { field: "territory", headerName: "Territory", flex: 0.8, renderCell: (params) => params.row.territory?.name || "N/A" },
    {
      field: "totalSales",
      headerName: "Total Sales",
      flex: 0.8,
      renderCell: (params) => `₹${Number(params.value || 0).toLocaleString()}`,
    },
    {
      field: "outstanding",
      headerName: "Outstanding",
      flex: 0.8,
      renderCell: (params) => `₹${Number(params.value || 0).toLocaleString()}`,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      renderCell: (params) => {
        const status = params.value || "active";
        return (
          <Chip
            label={status.toUpperCase()}
            color={status === "active" ? "success" : status === "blocked" ? "error" : "default"}
            size="small"
          />
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Dealers"
        subtitle="View and manage all dealers across the system"
        action={
          <Button variant="outlined" startIcon={<Download size={18} />}>
            Export
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mt: 2, mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Package size={24} color="#3b82f6" />
                <Typography variant="h6">Total Dealers</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {dealers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <TrendingUp size={24} color="#10b981" />
                <Typography variant="h6">Total Sales</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{totalSales.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <DollarSign size={24} color="#f59e0b" />
                <Typography variant="h6">Total Outstanding</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹{totalOutstanding.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search dealers by name or code..."
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
        endpoint="/dealers"
        columns={columns}
        title="Dealers"
        data={filteredDealers}
        loading={loading}
      />
    </Box>
  );
}

