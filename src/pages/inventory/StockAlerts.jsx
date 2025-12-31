import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Typography,
  Alert,
  Grid,
  IconButton,
} from "@mui/material";
import { Search, RefreshCw, AlertTriangle, TrendingDown, Download, FileSpreadsheet } from "lucide-react";
import { inventoryAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await inventoryAPI.getLowStockAlerts();
      const alertsData = data?.alerts || data?.data || data || [];
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      toast.error("Failed to load stock alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(
    (alert) =>
      !searchTerm ||
      alert.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.materialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const outOfStock = filteredAlerts.filter((a) => (a.stock ?? a.availableStock ?? 0) === 0);
  const lowStock = filteredAlerts.filter((a) => {
    const stock = a.stock ?? a.availableStock ?? 0;
    const minStock = a.minStock ?? a.reorderLevel ?? 0;
    return stock > 0 && stock < minStock;
  });

  return (
    <Box p={3}>
      <PageHeader
        title="Stock Alerts"
        subtitle="Monitor low stock and out of stock items"
        actions={[
          <Button key="refresh" variant="outlined" startIcon={<RefreshCw size={18} />} onClick={fetchAlerts}>
            Refresh
          </Button>,
        ]}
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Alerts
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {filteredAlerts.length}
                  </Typography>
                </Box>
                <AlertTriangle size={32} color="#ed6c02" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Out of Stock
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: "error.main" }}>
                    {outOfStock.length}
                  </Typography>
                </Box>
                <TrendingDown size={32} color="#d32f2f" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Low Stock
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: "warning.main" }}>
                    {lowStock.length}
                  </Typography>
                </Box>
                <AlertTriangle size={32} color="#ed6c02" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <TextField
            fullWidth
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
          />
        </CardContent>
      </Card>

      {/* Out of Stock Alerts */}
      {outOfStock.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingDown size={20} />
              Out of Stock Items ({outOfStock.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Min Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outOfStock.map((item, index) => (
                    <TableRow key={item.id || index} hover>
                      <TableCell>{item.name || item.materialName || "N/A"}</TableCell>
                      <TableCell>{item.materialNumber || item.materialCode || "N/A"}</TableCell>
                      <TableCell>{item.plant || "N/A"}</TableCell>
                      <TableCell align="right">{item.minStock || item.reorderLevel || "N/A"}</TableCell>
                      <TableCell>{item.uom || "EA"}</TableCell>
                      <TableCell>
                        <Chip label="Out of Stock" size="small" color="error" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "warning.main", display: "flex", alignItems: "center", gap: 1 }}>
              <AlertTriangle size={20} />
              Low Stock Items ({lowStock.length})
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Current Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Min Stock</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStock.map((item, index) => {
                    const stock = item.stock ?? item.availableStock ?? 0;
                    const minStock = item.minStock ?? item.reorderLevel ?? 0;
                    const deficit = minStock - stock;

                    return (
                      <TableRow key={item.id || index} hover>
                        <TableCell>{item.name || item.materialName || "N/A"}</TableCell>
                        <TableCell>{item.materialNumber || item.materialCode || "N/A"}</TableCell>
                        <TableCell>{item.plant || "N/A"}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "warning.main" }}>
                            {stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{minStock}</TableCell>
                        <TableCell>{item.uom || "EA"}</TableCell>
                        <TableCell>
                          <Chip label={`Low by ${deficit}`} size="small" color="warning" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {filteredAlerts.length === 0 && !loading && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Alert severity="success">No stock alerts - All inventory levels are healthy!</Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

