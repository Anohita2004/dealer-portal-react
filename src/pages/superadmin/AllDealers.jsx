import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import { Search, Download, TrendingUp, DollarSign, Package, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dealerAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ScopedDataTable from "../../components/ScopedDataTable";
import AdvancedFilterSidebar from "../../components/AdvancedFilterSidebar";
import FilterChips from "../../components/FilterChips";
import { useDebounce } from "../../hooks/useDebounce";
import { Chip } from "@mui/material";

export default function AllDealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    isActive: "",
    isBlocked: "",
    regionId: "",
    state: "",
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filterConfig = [
    {
      category: "Status",
      fields: [
        {
          id: "isActive",
          label: "Active Status",
          type: "select",
          options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }]
        },
        {
          id: "isBlocked",
          label: "Blocked Status",
          type: "select",
          options: [{ label: "Blocked", value: "true" }, { label: "Unblocked", value: "false" }]
        },
      ],
    },
    {
      category: "Location",
      fields: [
        { id: "state", label: "State", type: "text" },
      ],
    },
  ];

  const handleRemoveFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      isActive: "",
      isBlocked: "",
      regionId: "",
      state: "",
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await dealerAPI.getDealers();
      setDealers(Array.isArray(data) ? data : data.dealers || data.data || []);
    } catch (error) {
      console.error("Failed to fetch dealer stats:", error);
    }
  };

  const totalSales = dealers.reduce((sum, d) => sum + Number(d.totalSales || 0), 0);
  const totalOutstanding = dealers.reduce((sum, d) => sum + Number(d.outstanding || 0), 0);

  const columns = [
    { field: "businessName", headerName: "Business Name", flex: 1.2 },
    { field: "dealerCode", headerName: "Code", flex: 0.6, renderCell: (params) => params.row.dealerCode || params.row.code || "N/A" },
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
      flex: 0.7,
      renderCell: (params) => {
        const status = params.row.isBlocked
          ? "blocked"
          : params.row.isActive === false
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
      field: "actions",
      headerName: "Actions",
      flex: 1.2,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/superadmin/dealers/${params.row.id}`)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(`/superadmin/dealers/${params.row.id}`)}
          >
            Details
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="All Dealers"
        subtitle="Manage all dealers and view performance metrics"
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" startIcon={<Download size={18} />}>
              Export
            </Button>
            <Button variant="contained" onClick={() => navigate("/superadmin/dealers/new")}>
              Create Dealer
            </Button>
          </Box>
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

      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search dealers by name, code or city..."
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
          fetchFn={dealerAPI.getDealers}
          columns={columns}
          title="All Dealers"
          filters={filters}
          search={debouncedSearch}
          loading={loading}
        />
      </Box>

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
