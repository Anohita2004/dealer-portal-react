import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  Package,
  Factory,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Download,
  Plus,
  FileSpreadsheet,
  FileText,
  Boxes,
  Activity,
} from "lucide-react";
import { inventoryAPI, materialAPI } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import PageHeader from "../../components/PageHeader";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function InventoryDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalMaterials: 0,
    plants: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory summary
      const inventoryRes = await inventoryAPI.getSummary();
      console.log("Inventory API Response:", inventoryRes);
      
      // Handle response structure: { inventory: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }
      let inventoryData = [];
      if (Array.isArray(inventoryRes)) {
        inventoryData = inventoryRes;
      } else if (inventoryRes?.inventory && Array.isArray(inventoryRes.inventory)) {
        inventoryData = inventoryRes.inventory;
      } else if (inventoryRes?.data) {
        if (Array.isArray(inventoryRes.data)) {
          inventoryData = inventoryRes.data;
        } else if (inventoryRes.data.inventory && Array.isArray(inventoryRes.data.inventory)) {
          inventoryData = inventoryRes.data.inventory;
        }
      }
      
      console.log("Parsed Inventory Data:", inventoryData, "Count:", inventoryData.length);
      setInventory(inventoryData);
      
      if (inventoryData.length === 0) {
        console.warn("⚠️ Inventory array is empty. Response:", JSON.stringify(inventoryRes, null, 2));
        console.info("💡 This is normal if no inventory items have been created yet.");
      }

      // Fetch materials
      let materialsData = [];
      try {
        const materialsRes = await materialAPI.getMaterials();
        console.log("Materials API Response:", materialsRes);
        // Handle response structure: { materials: [...] }
        materialsData = 
          materialsRes?.materials || 
          materialsRes?.data?.materials || 
          materialsRes?.data || 
          (Array.isArray(materialsRes) ? materialsRes : []);
        console.log("Parsed Materials Data:", materialsData, "Count:", materialsData?.length);
        setMaterials(Array.isArray(materialsData) ? materialsData : []);
        
        // If materials have stock data, we can also use them for inventory display
        // Materials with stock can be treated as inventory items
        if (materialsData.length > 0 && inventoryData.length === 0) {
          const materialsWithStock = materialsData.filter(m => m.stock !== null && m.stock !== undefined);
          if (materialsWithStock.length > 0) {
            console.info("💡 Using materials with stock as inventory items:", materialsWithStock.length);
            // Optionally merge materials with stock into inventory for display
            // setInventory([...inventoryData, ...materialsWithStock.map(m => ({
            //   ...m,
            //   materialName: m.name,
            //   materialCode: m.materialNumber,
            //   availableStock: m.stock,
            //   minStock: m.reorderLevel
            // }))]);
          }
        }
      } catch (materialsError) {
        console.error("Error fetching materials:", materialsError);
        toast.error("Failed to load materials: " + (materialsError?.response?.data?.error || materialsError?.message || "Unknown error"));
        setMaterials([]);
      }

      // Fetch low stock alerts
      try {
        const alertsRes = await inventoryAPI.getLowStockAlerts();
        const alerts = alertsRes?.alerts || alertsRes?.data || [];
        setLowStockItems(Array.isArray(alerts) ? alerts : []);
      } catch (err) {
        console.warn("Low stock alerts not available:", err);
        // Calculate low stock from inventory data
        const lowStock = inventoryData.filter(
          (item) => item.stock !== null && item.minStock && item.stock < item.minStock
        );
        setLowStockItems(lowStock);
      }

      // Calculate summary - use materials with stock if inventory is empty
      const dataForSummary = inventoryData.length > 0 ? inventoryData : materialsData;
      const totalItems = dataForSummary.length;
      const totalValue = dataForSummary.reduce(
        (sum, item) => sum + (item.stock || 0) * (item.price || 0),
        0
      );
      const lowStockCount = dataForSummary.filter(
        (item) => {
          const stock = item.stock ?? item.availableStock ?? 0;
          const minStock = item.minStock ?? item.reorderLevel ?? 0;
          return stock !== null && minStock > 0 && stock < minStock && stock > 0;
        }
      ).length;
      const outOfStockCount = dataForSummary.filter(
        (item) => {
          const stock = item.stock ?? item.availableStock ?? 0;
          return stock === 0 || stock === null;
        }
      ).length;

      // Get unique plants from both inventory and materials
      const allPlants = [
        ...inventoryData.map((item) => item.plant || item.warehouse),
        ...materialsData.map((item) => item.plant)
      ].filter(Boolean);
      const plants = [...new Set(allPlants)];

      setSummary({
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount,
        totalMaterials: Array.isArray(materialsData) ? materialsData.length : 0,
        plants,
      });
      
      console.log("Dashboard Summary:", {
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount,
        totalMaterials: Array.isArray(materialsData) ? materialsData.length : 0,
        plants,
        inventoryCount: inventoryData.length,
        materialsCount: Array.isArray(materialsData) ? materialsData.length : 0,
      });
      
      // Debug: Log if no data found
      if (inventoryData.length === 0) {
        console.warn("⚠️ No inventory items found. Check API response structure.");
        console.log("Full inventory response:", JSON.stringify(inventoryRes, null, 2));
      }
      if (materialsData.length === 0) {
        console.warn("⚠️ No materials found. Check API response structure.");
      }
    } catch (err) {
      console.error("❌ Failed to load dashboard data:", err);
      console.error("Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      toast.error(
        err?.response?.data?.error || 
        err?.message || 
        "Failed to load inventory data. Check console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const blob = await inventoryAPI.exportInventory(format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `inventory_${new Date().toISOString().slice(0, 10)}.${format === "pdf" ? "pdf" : "xlsx"}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Inventory exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to export inventory");
    }
  };

  // Prepare chart data
  const plantWiseData = inventory.reduce((acc, item) => {
    if (!item.plant) return acc;
    if (!acc[item.plant]) {
      acc[item.plant] = { name: item.plant, stock: 0, items: 0 };
    }
    acc[item.plant].stock += item.stock || 0;
    acc[item.plant].items += 1;
    return acc;
  }, {});

  const plantChartData = Object.values(plantWiseData);

  const stockStatusData = [
    { name: "In Stock", value: summary.totalItems - summary.lowStockCount - summary.outOfStockCount },
    { name: "Low Stock", value: summary.lowStockCount },
    { name: "Out of Stock", value: summary.outOfStockCount },
  ];

  const filteredLowStock = lowStockItems.filter(
    (item) =>
      !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Comprehensive inventory overview and management"
        actions={[
          <Button
            key="export-pdf"
            variant="outlined"
            startIcon={<FileText size={18} />}
              onClick={() => handleExport("pdf")}
            sx={{ mr: 1 }}
          >
            Export PDF
          </Button>,
          <Button
            key="export-excel"
            variant="outlined"
            startIcon={<FileSpreadsheet size={18} />}
              onClick={() => handleExport("excel")}
            sx={{ mr: 1 }}
          >
            Export Excel
          </Button>,
          <Button
            key="refresh"
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>,
        ]}
      />

      {/* Debug Info - Remove in production */}
      {(inventory.length === 0 || materials.length === 0) && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Debug Information:
          </Typography>
          <Typography variant="body2">
            Inventory Items: {inventory.length} | Materials: {materials.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Check browser console (F12) for detailed API response logs
          </Typography>
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Items
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {summary.totalItems}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: "primary.light",
                    borderRadius: "50%",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={24} color="#1976d2" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Materials
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {summary.totalMaterials}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: "success.light",
                    borderRadius: "50%",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Boxes size={24} color="#2e7d32" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Low Stock Items
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: "warning.main" }}>
                    {summary.lowStockCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: "warning.light",
                    borderRadius: "50%",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={24} color="#ed6c02" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: "error.main" }}>
                    {summary.outOfStockCount}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: "error.light",
                    borderRadius: "50%",
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingDown size={24} color="#d32f2f" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Stock Status Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Stock Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Plant Distribution */}
        {plantChartData.length > 0 && (
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                  <Factory size={20} />
                  Stock by Plant
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={plantChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="stock" fill="#3b82f6" name="Total Stock" />
                    <Bar dataKey="items" fill="#10b981" name="Items Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Materials List - Show even if no inventory */}
      {materials.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
              <Boxes size={20} />
              Materials Master Data ({materials.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Reorder Level</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materials.slice(0, 10).map((material, index) => {
                    const stock = material.stock ?? 0;
                    const reorderLevel = material.reorderLevel ?? 0;
                    const isOutOfStock = stock === 0;
                    const isLowStock = reorderLevel > 0 && stock < reorderLevel && stock > 0;
                    const status = isOutOfStock ? { label: "Out of Stock", color: "error" } : 
                                  isLowStock ? { label: "Low Stock", color: "warning" } : 
                                  { label: "In Stock", color: "success" };

                    return (
                      <TableRow key={material.id || index} hover>
                        <TableCell>{material.name || "N/A"}</TableCell>
                        <TableCell>{material.materialNumber || "N/A"}</TableCell>
                        <TableCell>{material.uom || "EA"}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{reorderLevel || "—"}</TableCell>
                        <TableCell>{material.plant || "—"}</TableCell>
                        <TableCell>
                          {material.group?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Chip label={status.label} size="small" color={status.color} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {materials.length > 10 && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button variant="outlined" onClick={() => navigate("/materials")}>
                  View All Materials ({materials.length})
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inventory Items Table */}
      {inventory.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
              <Package size={20} />
              Inventory Items ({inventory.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Min Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.slice(0, 10).map((item, index) => {
                    const stock = item.stock ?? item.availableStock ?? 0;
                    const minStock = item.minStock ?? item.reorderLevel ?? 0;
                    const isOutOfStock = stock === 0;
                    const isLowStock = minStock && stock < minStock && stock > 0;
                    const status = isOutOfStock ? { label: "Out of Stock", color: "error" } : 
                                  isLowStock ? { label: "Low Stock", color: "warning" } : 
                                  { label: "In Stock", color: "success" };

                    return (
                      <TableRow key={item.id || index} hover>
                        <TableCell>{item.name || item.materialName || "N/A"}</TableCell>
                        <TableCell>{item.materialNumber || item.materialCode || "N/A"}</TableCell>
                        <TableCell>{item.plant || item.warehouse || "N/A"}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{minStock || "N/A"}</TableCell>
                        <TableCell>{item.uom || "EA"}</TableCell>
                        <TableCell>
                          <Chip label={status.label} size="small" color={status.color} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {inventory.length > 10 && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button variant="outlined" onClick={() => navigate("/inventory/details")}>
                  View All Inventory Items ({inventory.length})
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
              <AlertTriangle size={20} color="#ed6c02" />
              Low Stock Alerts
            </Typography>
            <TextField
              size="small"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          </Box>

          {filteredLowStock.length === 0 && inventory.length > 0 ? (
            <Alert severity="success">No low stock items - All inventory levels are healthy!</Alert>
          ) : filteredLowStock.length === 0 && inventory.length === 0 ? (
            <Alert severity="info">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                No inventory items found
              </Typography>
              <Typography variant="body2">
                {materials.length > 0 
                  ? `${materials.length} materials are defined but no inventory stock has been added yet. Use "Inventory Details" to add stock levels.`
                  : "No materials or inventory items found. Create materials first, then add inventory stock."}
              </Typography>
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Current Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Min Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLowStock.slice(0, 10).map((item, index) => {
                    const stock = item.stock ?? item.availableStock ?? 0;
                    const minStock = item.minStock ?? item.reorderLevel ?? 0;
                    const isOutOfStock = stock === 0;
                    const isLowStock = stock < minStock && stock > 0;

                    return (
                      <TableRow key={item.id || index} hover>
                        <TableCell>{item.name || item.materialName || "N/A"}</TableCell>
                        <TableCell>{item.materialNumber || item.materialCode || "N/A"}</TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: isOutOfStock ? "error.main" : "warning.main" }}
                          >
                            {stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{minStock}</TableCell>
                        <TableCell>{item.uom || "EA"}</TableCell>
                        <TableCell>{item.plant || "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            label={isOutOfStock ? "Out of Stock" : "Low Stock"}
                            size="small"
                            color={isOutOfStock ? "error" : "warning"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredLowStock.length > 10 && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button variant="outlined" onClick={() => navigate("/inventory/alerts")}>
                View All Alerts ({filteredLowStock.length})
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: "pointer",
              "&:hover": { boxShadow: 4 },
              transition: "all 0.3s",
            }}
            onClick={() => navigate("/inventory/details")}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Activity size={32} color="#3b82f6" style={{ marginBottom: 8 }} />
              <Typography variant="h6">Inventory Details</Typography>
              <Typography variant="body2" color="text.secondary">
                View and manage all inventory items
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: "pointer",
              "&:hover": { boxShadow: 4 },
              transition: "all 0.3s",
            }}
            onClick={() => navigate("/inventory/alerts")}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <AlertTriangle size={32} color="#ed6c02" style={{ marginBottom: 8 }} />
              <Typography variant="h6">Stock Alerts</Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor low stock and alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: "pointer",
              "&:hover": { boxShadow: 4 },
              transition: "all 0.3s",
            }}
            onClick={() => navigate("/materials")}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Boxes size={32} color="#10b981" style={{ marginBottom: 8 }} />
              <Typography variant="h6">Materials</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage material master data
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: "pointer",
              "&:hover": { boxShadow: 4 },
              transition: "all 0.3s",
            }}
            onClick={() => navigate("/inventory/plants")}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Factory size={32} color="#8b5cf6" style={{ marginBottom: 8 }} />
              <Typography variant="h6">Warehouse Inventory</Typography>
              <Typography variant="body2" color="text.secondary">
                View inventory by warehouse (Plant = Warehouse)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
