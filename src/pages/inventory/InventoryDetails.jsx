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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Search,
  RefreshCw,
  Edit2,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { inventoryAPI, materialAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function InventoryDetails() {
  const [inventory, setInventory] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [plantFilter, setPlantFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [plants, setPlants] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [formData, setFormData] = useState({
    stock: "",
    minStock: "",
    reason: "",
  });

  useEffect(() => {
    fetchInventory();
  }, [page, searchTerm, plantFilter, stockFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        plant: plantFilter || undefined,
        stockFilter: stockFilter !== "all" ? stockFilter : undefined,
      };

      const data = await inventoryAPI.getDetails(params);
      console.log("Inventory Details API Response:", data);
      const items = data?.inventory || data?.data || data || [];
      const inventoryItems = Array.isArray(items) ? items : [];
      
      // If inventory is empty, fetch materials as fallback
      if (inventoryItems.length === 0) {
        console.log("Inventory is empty, fetching materials...");
        try {
          const materialsRes = await materialAPI.getMaterials();
          console.log("Materials API Response:", materialsRes);
          const materialsData = materialsRes?.materials || materialsRes?.data || (Array.isArray(materialsRes) ? materialsRes : []);
          
          // Convert materials to inventory-like format
          const materialsAsInventory = Array.isArray(materialsData) ? materialsData.map(material => ({
            id: material.id,
            name: material.name,
            materialName: material.name,
            materialNumber: material.materialNumber,
            plant: material.plant,
            stock: material.stock ?? 0,
            minStock: material.reorderLevel ?? 0,
            reorderLevel: material.reorderLevel ?? 0,
            uom: material.uom || "EA",
            isFromMaterials: true, // Flag to identify these came from materials
          })) : [];
          
          setMaterials(materialsAsInventory);
          setInventory(materialsAsInventory);
          
          // Extract unique plants from materials
          const uniquePlants = [...new Set(materialsAsInventory.map((item) => item.plant).filter(Boolean))];
          setPlants(uniquePlants);
          setTotalPages(Math.ceil(materialsAsInventory.length / pageSize));
        } catch (materialsError) {
          console.error("Failed to fetch materials:", materialsError);
          setMaterials([]);
          setInventory([]);
        }
      } else {
        setInventory(inventoryItems);
        setMaterials([]);
        setTotalPages(data?.totalPages || Math.ceil((data?.total || 0) / pageSize));
        
        // Extract unique plants
        const uniquePlants = [...new Set(inventoryItems.map((item) => item.plant).filter(Boolean))];
        setPlants(uniquePlants);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      toast.error("Failed to load inventory");
      setInventory([]);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditDialog({ open: true, item });
    setFormData({
      stock: item.stock || "",
      minStock: item.minStock || item.reorderLevel || "",
      reason: "",
    });
  };

  const handleSaveEdit = async () => {
    try {
      // If item is from materials, we might need to update material instead
      if (editDialog.item?.isFromMaterials) {
        toast.info("Updating material stock...");
        // For now, use inventory API - backend should handle material updates
        const adjustment = Number(formData.stock) - (editDialog.item.stock || 0);
        await inventoryAPI.adjustStock(editDialog.item.id, adjustment, formData.reason);
      } else {
        const adjustment = Number(formData.stock) - (editDialog.item.stock || 0);
        await inventoryAPI.adjustStock(editDialog.item.id, adjustment, formData.reason);
      }
      toast.success("Stock updated successfully");
      setEditDialog({ open: false, item: null });
      fetchInventory();
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast.error("Failed to update stock: " + (error?.response?.data?.error || error?.message || "Unknown error"));
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
        `inventory_details_${new Date().toISOString().slice(0, 10)}.${format === "pdf" ? "pdf" : "xlsx"}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Inventory exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to export inventory");
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0 || stock === null) {
      return { label: "Out of Stock", color: "error" };
    }
    if (minStock && stock < minStock) {
      return { label: "Low Stock", color: "warning" };
    }
    return { label: "In Stock", color: "success" };
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlant = !plantFilter || item.plant === plantFilter;
    
    // Apply stock filter
    const stock = item.stock ?? item.availableStock ?? 0;
    const minStock = item.minStock ?? item.reorderLevel ?? 0;
    let matchesStock = true;
    if (stockFilter !== "all") {
      if (stockFilter === "low") {
        matchesStock = minStock > 0 && stock < minStock && stock > 0;
      } else if (stockFilter === "out") {
        matchesStock = stock === 0 || stock === null;
      } else if (stockFilter === "in") {
        matchesStock = stock > 0 && (minStock === 0 || stock >= minStock);
      }
    }
    
    return matchesSearch && matchesPlant && matchesStock;
  });

  return (
    <Box p={3}>
      <PageHeader
        title="Inventory Details"
        subtitle="View and manage all inventory items"
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
          <Button key="refresh" variant="outlined" startIcon={<RefreshCw size={18} />} onClick={fetchInventory}>
            Refresh
          </Button>,
        ]}
      />

      {/* Filters */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, material number..."
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
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Plant</InputLabel>
                <Select value={plantFilter} onChange={(e) => setPlantFilter(e.target.value)} label="Plant">
                  <MenuItem value="">All Plants</MenuItem>
                  {plants.map((plant) => (
                    <MenuItem key={plant} value={plant}>
                      {plant}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} label="Stock Status">
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="low">Low Stock</MenuItem>
                  <MenuItem value="out">Out of Stock</MenuItem>
                  <MenuItem value="in">In Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Plant</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Current Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Min Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Alert severity="info">
                        {materials.length > 0 
                          ? "No inventory items match the current filters. Try adjusting your search or filters."
                          : "No inventory items found. Materials may need to be added to inventory."}
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const stock = item.stock ?? item.availableStock ?? 0;
                    const minStock = item.minStock ?? item.reorderLevel ?? 0;
                    const status = getStockStatus(stock, minStock);

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.name || item.materialName || "N/A"}</TableCell>
                        <TableCell>{item.materialNumber || item.materialCode || "N/A"}</TableCell>
                        <TableCell>{item.plant || "N/A"}</TableCell>
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
                        <TableCell align="center">
                          <Tooltip title="Adjust Stock">
                            <IconButton size="small" onClick={() => handleEdit(item)}>
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Material: {editDialog.item?.name || editDialog.item?.materialName || "N/A"}
          </Typography>
          <TextField
            fullWidth
            label="Current Stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            margin="normal"
            InputProps={{ inputProps: { min: 0 } }}
          />
          <TextField
            fullWidth
            label="Minimum Stock (Reorder Level)"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            margin="normal"
            InputProps={{ inputProps: { min: 0 } }}
          />
          <TextField
            fullWidth
            label="Reason for Adjustment"
            multiline
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            margin="normal"
            placeholder="Enter reason for stock adjustment..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, item: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

