import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import {
  RefreshCw,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Factory,
  BarChart3,
} from "lucide-react";
import { inventoryAPI, materialAPI, warehouseAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function InventoryReports() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [dateRange, setDateRange] = useState("30"); // days
  const [warehouses, setWarehouses] = useState([]);
  const [reportData, setReportData] = useState({
    summary: null,
    warehouseSummary: [],
    lowStockItems: [],
    stockMovement: [],
    materialUsage: [],
    stockValuation: null,
  });

  useEffect(() => {
    fetchWarehouses();
    fetchReportData();
  }, [warehouseFilter, dateRange]);

  const fetchWarehouses = async () => {
    try {
      const warehousesRes = await warehouseAPI.getAll().catch(() => ({ data: [] }));
      const warehousesData = warehousesRes?.data || warehousesRes?.warehouses || [];
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data
      const [materialsRes, inventoryRes, alertsRes] = await Promise.all([
        materialAPI.getMaterials().catch(() => ({ materials: [] })),
        inventoryAPI.getSummary().catch(() => ({ inventory: [] })),
        inventoryAPI.getLowStockAlerts().catch(() => ({ alerts: [] })),
      ]);

      // Parse data
      const materialsData = materialsRes?.materials || materialsRes?.data || [];
      const materialsArray = Array.isArray(materialsData) ? materialsData : [];
      
      const inventoryData = inventoryRes?.inventory || inventoryRes?.data || [];
      const inventoryArray = Array.isArray(inventoryData) ? inventoryData : [];

      const alertsData = alertsRes?.alerts || alertsRes?.data || [];
      const alertsArray = Array.isArray(alertsData) ? alertsData : [];

      // Combine materials and inventory
      const allItems = [
        ...inventoryArray.map(item => ({
          ...item,
          name: item.name || item.materialName,
          materialNumber: item.materialNumber || item.materialCode,
          stock: item.stock ?? item.availableStock ?? 0,
          minStock: item.minStock ?? item.reorderLevel ?? 0,
          plant: item.plant || item.warehouse,
        })),
        ...materialsArray
          .filter(m => m.plant)
          .map(material => ({
            ...material,
            name: material.name,
            materialNumber: material.materialNumber,
            stock: material.stock ?? 0,
            minStock: material.reorderLevel ?? 0,
            plant: material.plant,
          })),
      ];

      // Filter by warehouse if selected
      const filteredItems = warehouseFilter
        ? allItems.filter(item => (item.plant || item.warehouse) === warehouseFilter)
        : allItems;

      // Calculate summary
      const summary = {
        totalItems: filteredItems.length,
        totalStock: filteredItems.reduce((sum, item) => sum + (item.stock ?? 0), 0),
        lowStock: filteredItems.filter(item => {
          const stock = item.stock ?? 0;
          const minStock = item.minStock ?? 0;
          return minStock > 0 && stock < minStock && stock > 0;
        }).length,
        outOfStock: filteredItems.filter(item => (item.stock ?? 0) === 0).length,
        totalValue: filteredItems.reduce((sum, item) => sum + ((item.stock ?? 0) * (item.price ?? 0)), 0),
      };

      // Group by warehouse
      const warehouseSummary = {};
      filteredItems.forEach((item) => {
        const warehouse = item.plant || item.warehouse || "Unassigned";
        if (!warehouseSummary[warehouse]) {
          warehouseSummary[warehouse] = {
            warehouse,
            totalItems: 0,
            totalStock: 0,
            lowStock: 0,
            outOfStock: 0,
          };
        }
        const stock = item.stock ?? 0;
        const minStock = item.minStock ?? 0;
        warehouseSummary[warehouse].totalItems += 1;
        warehouseSummary[warehouse].totalStock += stock;
        if (stock === 0) {
          warehouseSummary[warehouse].outOfStock += 1;
        } else if (minStock > 0 && stock < minStock) {
          warehouseSummary[warehouse].lowStock += 1;
        }
      });

      // Low stock items
      const lowStockItems = filteredItems
        .filter(item => {
          const stock = item.stock ?? 0;
          const minStock = item.minStock ?? 0;
          return minStock > 0 && stock < minStock;
        })
        .sort((a, b) => {
          const aStock = a.stock ?? 0;
          const bStock = b.stock ?? 0;
          return aStock - bStock;
        });

      // Stock status distribution
      const stockStatusData = [
        { name: "In Stock", value: filteredItems.filter(item => {
          const stock = item.stock ?? 0;
          const minStock = item.minStock ?? 0;
          return stock > 0 && (minStock === 0 || stock >= minStock);
        }).length },
        { name: "Low Stock", value: summary.lowStock },
        { name: "Out of Stock", value: summary.outOfStock },
      ];

      // Top materials by stock
      const topMaterials = [...filteredItems]
        .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
        .slice(0, 10)
        .map(item => ({
          name: item.name || "N/A",
          stock: item.stock ?? 0,
        }));

      setReportData({
        summary,
        warehouseSummary: Object.values(warehouseSummary),
        lowStockItems,
        stockStatusData,
        topMaterials,
        stockValuation: summary.totalValue,
      });
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      toast.error("Failed to load inventory reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      toast.info(`Exporting inventory report as ${format.toUpperCase()}...`);
      // TODO: Implement actual export API call
      // const blob = await inventoryAPI.exportInventory(format);
      // Download logic here
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const renderSummaryTab = () => {
    const { summary, stockStatusData, topMaterials } = reportData;

    if (!summary) return null;

    return (
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                {summary.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Stock
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                {summary.totalStock.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Low Stock Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: "warning.main" }}>
                {summary.lowStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Out of Stock
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: "error.main" }}>
                {summary.outOfStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Stock Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top 10 Materials by Stock
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topMaterials}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderWarehouseTab = () => {
    const { warehouseSummary } = reportData;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Warehouse Summary
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total Items</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Low Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Out of Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouseSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Alert severity="info">No warehouse data available</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouseSummary.map((warehouse, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Factory size={18} />
                          {warehouse.warehouse}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{warehouse.totalItems}</TableCell>
                      <TableCell align="right">{warehouse.totalStock.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={warehouse.lowStock}
                          size="small"
                          color={warehouse.lowStock > 0 ? "warning" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={warehouse.outOfStock}
                          size="small"
                          color={warehouse.outOfStock > 0 ? "error" : "default"}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderLowStockTab = () => {
    const { lowStockItems } = reportData;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Low Stock Alerts ({lowStockItems.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Current Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Reorder Level</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lowStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Alert severity="success">No low stock items - All inventory levels are healthy!</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.map((item, index) => {
                    const stock = item.stock ?? 0;
                    const minStock = item.minStock ?? 0;
                    const deficit = minStock - stock;

                    return (
                      <TableRow key={item.id || index} hover>
                        <TableCell>{item.name || "N/A"}</TableCell>
                        <TableCell>{item.materialNumber || "N/A"}</TableCell>
                        <TableCell>{item.plant || item.warehouse || "—"}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>
                            {stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{minStock}</TableCell>
                        <TableCell>{item.uom || "EA"}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${deficit} below reorder`}
                            size="small"
                            color="warning"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box p={3}>
      <PageHeader
        title="Inventory Reports"
        subtitle="Comprehensive inventory analytics and reports"
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
            onClick={fetchReportData}
          >
            Refresh
          </Button>,
        ]}
      />

      {/* Filters */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Warehouse</InputLabel>
                <Select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  label="Warehouse"
                >
                  <MenuItem value="">All Warehouses</MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id || warehouse.code} value={warehouse.code || warehouse.name}>
                      {warehouse.name || warehouse.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                  <MenuItem value="365">Last year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Summary" icon={<BarChart3 size={18} />} iconPosition="start" />
          <Tab label="Warehouse Analysis" icon={<Factory size={18} />} iconPosition="start" />
          <Tab label="Low Stock Alerts" icon={<AlertTriangle size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {activeTab === 0 && renderSummaryTab()}
            {activeTab === 1 && renderWarehouseTab()}
            {activeTab === 2 && renderLowStockTab()}
          </>
        )}
      </Box>
    </Box>
  );
}

