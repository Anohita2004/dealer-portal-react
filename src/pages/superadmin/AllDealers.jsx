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
import { useNavigate } from "react-router-dom";
import { dealerAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";

export default function AllDealers() {
  const navigate = useNavigate();
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

  const handleToggleBlock = async (dealer) => {
    const action = dealer.isBlocked ? "unblock" : "block";
    const reason = window.prompt(
      `Enter reason to ${action} this dealer:`
    );
    if (!reason) return;

    try {
      await dealerAPI.blockDealer(dealer.id, !dealer.isBlocked, reason);
      toast.success(`Dealer ${action}ed successfully`);
      fetchDealers();
    } catch (error) {
      console.error("Failed to update dealer status:", error);
      toast.error("Failed to update dealer block status");
    }
  };

  const handleVerify = async (dealer) => {
    const licenseNumber = window.prompt("Enter License Number:");
    if (!licenseNumber) return;
    const licenseDocument =
      window.prompt("Enter License Document URL (optional):") || null;

    try {
      await dealerAPI.verifyDealer(dealer.id, {
        licenseNumber,
        licenseDocument,
      });
      toast.success("Dealer verified successfully");
      fetchDealers();
    } catch (error) {
      console.error("Failed to verify dealer:", error);
      toast.error("Failed to verify dealer");
    }
  };

  const columns = [
    { key: "businessName", label: "Business Name" },
    {
      key: "dealerCode",
      label: "Code",
      render: (_, row) => row.dealerCode || row.code || "N/A",
    },
    {
      key: "region",
      label: "Region",
      render: (_, row) => row.region?.name || "N/A",
    },
    {
      key: "territory",
      label: "Territory",
      render: (_, row) => row.territory?.name || "N/A",
    },
    {
      key: "totalSales",
      label: "Total Sales",
      render: (value) => `₹${Number(value || 0).toLocaleString()}`,
    },
    {
      key: "outstanding",
      label: "Outstanding",
      render: (value) => `₹${Number(value || 0).toLocaleString()}`,
    },
    {
      key: "status",
      label: "Status",
      render: (_, row) => {
        const status = row.isBlocked
          ? "blocked"
          : row.isActive === false
          ? "inactive"
          : "active";
        return (
          <Chip
            label={status.toUpperCase()}
            color={
              status === "active"
                ? "success"
                : status === "blocked"
                ? "error"
                : "default"
            }
            size="small"
          />
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/superadmin/dealers/${row.id}`)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color={row.isBlocked ? "success" : "error"}
            onClick={() => handleToggleBlock(row)}
          >
            {row.isBlocked ? "Unblock" : "Block"}
          </Button>
          {!row.isVerified && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => handleVerify(row)}
            >
              Verify
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Dealers"
        subtitle="View and manage all dealers across the system"
        actions={[
          <Button
            key="export"
            variant="outlined"
            startIcon={<Download size={18} />}
          >
            Export
          </Button>,
          <Button
            key="create"
            variant="contained"
            onClick={() => navigate("/superadmin/dealers/new")}
          >
            Create Dealer
          </Button>,
        ]}
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

