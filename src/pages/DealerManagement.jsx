import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search, TrendingUp, DollarSign, Package } from "lucide-react";
import { managerAPI } from "../services/api";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import ScopedDataTable from "../components/ScopedDataTable";

export default function DealerManagement() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const data = await managerAPI.getDealers();
      setDealers(Array.isArray(data) ? data : data.dealers || []);
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

  const columns = [
    { field: "businessName", headerName: "Business Name", flex: 1 },
    { field: "code", headerName: "Code", flex: 0.5 },
    {
      field: "totalSales",
      headerName: "Total Sales",
      flex: 0.8,
      renderCell: (params) => `₹${Number(params.value || 0).toLocaleString()}`,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.6,
      renderCell: (params) => (
        <Chip
          label={params.value || "Active"}
          color={params.value === "active" ? "success" : "default"}
          size="small"
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dealer Management"
        subtitle="View and manage dealers under your territory/area"
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
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
                ₹
                {dealers
                  .reduce((sum, d) => sum + Number(d.totalSales || 0), 0)
                  .toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <DollarSign size={24} color="#f59e0b" />
                <Typography variant="h6">Outstanding</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ₹
                {dealers
                  .reduce((sum, d) => sum + Number(d.outstanding || 0), 0)
                  .toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
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
          sx={{ mb: 2 }}
        />

        <ScopedDataTable
          endpoint="/managers/dealers"
          columns={columns}
          title="Dealers"
          data={filteredDealers}
          loading={loading}
        />
      </Box>
    </Box>
  );
}

