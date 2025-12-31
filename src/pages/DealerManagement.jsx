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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Search, TrendingUp, DollarSign, Package, Filter } from "lucide-react";
import { dealerAPI, managerAPI, userAPI } from "../services/api";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import ScopedDataTable from "../components/ScopedDataTable";
import AdvancedFilterSidebar from "../components/AdvancedFilterSidebar";
import FilterChips from "../components/FilterChips";
import { useDebounce } from "../hooks/useDebounce";

export default function DealerManagement() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDealerId, setAssignDealerId] = useState("");
  const [assignManagerId, setAssignManagerId] = useState("");
  const [managerOptions, setManagerOptions] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Advanced Filters
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    isActive: "",
    isBlocked: "",
    state: "",
    createdAt_from: "",
    createdAt_to: "",
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
    {
      category: "Timeline",
      fields: [
        { id: "createdAt_from", label: "Registered From", type: "date" },
        { id: "createdAt_to", label: "Registered To", type: "date" },
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
      state: "",
      createdAt_from: "",
      createdAt_to: "",
    });
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      // Use /dealers endpoint which is automatically scoped by user role
      const data = await dealerAPI.getDealers({ page: 1, pageSize: 100 });
      setDealers(Array.isArray(data) ? data : data.data || data.dealers || []);
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
      toast.error("Failed to load dealers");
      setDealers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      setLoadingManagers(true);
      const params = {
        role: [
          "regional_manager",
          "area_manager",
          "territory_manager",
          "sales_executive",
        ].join(","),
      };
      const data = await userAPI.getUsers(params);
      const list = data.users || data.data || data || [];
      setManagerOptions(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to load managers:", error);
      toast.error("Failed to load managers");
      setManagerOptions([]);
    } finally {
      setLoadingManagers(false);
    }
  };

  const openAssignDialog = (dealerId = "") => {
    setAssignDealerId(dealerId);
    setAssignManagerId("");
    setAssignDialogOpen(true);
    loadManagers();
  };

  const handleAssignDealer = async (e) => {
    e.preventDefault();
    if (!assignDealerId) {
      toast.error("Please select a dealer");
      return;
    }
    if (!assignManagerId) {
      toast.error("Please select a manager");
      return;
    }
    try {
      await managerAPI.assignDealer({
        dealerId: assignDealerId,
        managerId: assignManagerId,
      });
      toast.success("Dealer assigned to manager successfully");
      setAssignDialogOpen(false);
      fetchDealers();
    } catch (error) {
      console.error("Failed to assign dealer:", error);
      toast.error(error.response?.data?.error || "Failed to assign dealer to manager");
    }
  };

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
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => openAssignDialog()}
          >
            Assign Dealer to Manager
          </Button>
        </Box>

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
          endpoint="/dealers"
          columns={columns}
          title="Dealers"
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

      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleAssignDealer}>
          <DialogTitle>Assign Dealer to Manager</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Dealer</InputLabel>
                  <Select
                    label="Dealer"
                    value={assignDealerId}
                    onChange={(e) => setAssignDealerId(e.target.value)}
                  >
                    {dealers.map((dealer) => (
                      <MenuItem key={dealer.id} value={dealer.id}>
                        {dealer.businessName || dealer.name || dealer.dealerCode}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Manager</InputLabel>
                  <Select
                    label="Manager"
                    value={assignManagerId}
                    onChange={(e) => setAssignManagerId(e.target.value)}
                    disabled={loadingManagers}
                  >
                    {managerOptions.map((manager) => (
                      <MenuItem key={manager.id} value={manager.id}>
                        {manager.username} (
                        {manager.roleDetails?.name || manager.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Assign
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
