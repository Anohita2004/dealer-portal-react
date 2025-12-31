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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Factory, RefreshCw, ChevronDown, Search } from "lucide-react";
import { inventoryAPI, materialAPI, warehouseAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function PlantInventory() {
  const [warehousesData, setWarehousesData] = useState({}); // { warehouseName: { items: [], summary: {} } }
  const [warehouseMap, setWarehouseMap] = useState({}); // { plantCode: warehouseName }
  const [loading, setLoading] = useState(false);
  const [expandedWarehouse, setExpandedWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllWarehousesInventory();
  }, []);

  const fetchAllWarehousesInventory = async () => {
    try {
      setLoading(true);
      
      // Fetch warehouses, materials and inventory data
      const [warehousesRes, materialsRes, inventoryRes] = await Promise.all([
        warehouseAPI.getAll().catch(() => ({ data: [], warehouses: [] })),
        materialAPI.getMaterials().catch(() => ({ materials: [] })),
        inventoryAPI.getSummary().catch(() => ({ inventory: [] })),
      ]);

      // Create mapping from plant code to warehouse name
      const warehousesData = warehousesRes?.data || warehousesRes?.warehouses || (Array.isArray(warehousesRes) ? warehousesRes : []);
      const warehousesArray = Array.isArray(warehousesData) ? warehousesData : [];
      
      const plantToWarehouseMap = {};
      warehousesArray.forEach((warehouse) => {
        // Map by code, name, or id - depending on what's available
        if (warehouse.code) {
          plantToWarehouseMap[warehouse.code] = warehouse.name || warehouse.code;
        }
        if (warehouse.name) {
          plantToWarehouseMap[warehouse.name] = warehouse.name;
        }
        if (warehouse.plantCode) {
          plantToWarehouseMap[warehouse.plantCode] = warehouse.name || warehouse.plantCode;
        }
      });
      
      setWarehouseMap(plantToWarehouseMap);

      // Parse materials data
      const materialsData = materialsRes?.materials || materialsRes?.data || (Array.isArray(materialsRes) ? materialsRes : []);
      const materialsArray = Array.isArray(materialsData) ? materialsData : [];

      // Parse inventory data
      const inventoryData = inventoryRes?.inventory || inventoryRes?.data || (Array.isArray(inventoryRes) ? inventoryRes : []);
      const inventoryArray = Array.isArray(inventoryData) ? inventoryData : [];

      // Combine materials and inventory (materials have stock info)
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
          .filter(m => m.plant) // Only include materials with plant/warehouse
          .map(material => ({
            ...material,
            name: material.name,
            materialNumber: material.materialNumber,
            stock: material.stock ?? 0,
            minStock: material.reorderLevel ?? 0,
            plant: material.plant,
          })),
      ];

      // Group by warehouse/plant - use warehouse name if available, otherwise use plant code
      const grouped = {};
      allItems.forEach((item) => {
        const plantCode = item.plant || item.warehouse;
        // Get warehouse name from map, or use plant code, or "Unassigned"
        const warehouseDisplayName = plantCode 
          ? (plantToWarehouseMap[plantCode] || plantCode)
          : "Unassigned";
        
        if (!grouped[warehouseDisplayName]) {
          grouped[warehouseDisplayName] = {
            items: [],
            summary: { totalItems: 0, totalStock: 0, lowStock: 0, outOfStock: 0 },
            plantCode: plantCode, // Keep original plant code for reference
          };
        }
        grouped[warehouseDisplayName].items.push(item);
        
        const stock = item.stock ?? 0;
        const minStock = item.minStock ?? 0;
        grouped[warehouseDisplayName].summary.totalItems += 1;
        grouped[warehouseDisplayName].summary.totalStock += stock;
        if (stock === 0) {
          grouped[warehouseDisplayName].summary.outOfStock += 1;
        } else if (minStock > 0 && stock < minStock) {
          grouped[warehouseDisplayName].summary.lowStock += 1;
        }
      });

      setWarehousesData(grouped);
      
      // Expand first warehouse by default
      const warehouseNames = Object.keys(grouped);
      if (warehouseNames.length > 0 && !expandedWarehouse) {
        setExpandedWarehouse(warehouseNames[0]);
      }
    } catch (error) {
      console.error("Failed to fetch warehouses inventory:", error);
      toast.error("Failed to load warehouses inventory");
      setWarehousesData({});
    } finally {
      setLoading(false);
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

  const handleExpand = (warehouse) => {
    setExpandedWarehouse(expandedWarehouse === warehouse ? null : warehouse);
  };

  const filteredWarehouses = Object.keys(warehousesData).filter((warehouse) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const items = warehousesData[warehouse].items;
    return (
      warehouse.toLowerCase().includes(searchLower) ||
      items.some(
        (item) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.materialNumber?.toLowerCase().includes(searchLower)
      )
    );
  });

  const totalWarehouses = Object.keys(warehousesData).length;
  const totalItems = Object.values(warehousesData).reduce(
    (sum, w) => sum + w.summary.totalItems,
    0
  );
  const totalStock = Object.values(warehousesData).reduce(
    (sum, w) => sum + w.summary.totalStock,
    0
  );

  return (
    <Box p={3}>
      <PageHeader
        title="Warehouse Inventory"
        subtitle={`View inventory across all warehouses (${totalWarehouses} warehouses, ${totalItems} items)`}
        actions={[
          <Button key="refresh" variant="outlined" startIcon={<RefreshCw size={18} />} onClick={fetchAllWarehousesInventory}>
            Refresh
          </Button>,
        ]}
      />

      {/* Overall Summary */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Warehouses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                {totalWarehouses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                {totalItems}
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
                {totalStock.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Low Stock Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 1, color: "warning.main" }}>
                {Object.values(warehousesData).reduce((sum, w) => sum + w.summary.lowStock, 0)}
              </Typography>
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
            placeholder="Search warehouses or materials..."
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

      {/* Warehouses List */}
      {loading ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      ) : filteredWarehouses.length === 0 ? (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Alert severity="info">
              {searchTerm
                ? "No warehouses or materials match your search"
                : "No warehouses found. Materials may not have warehouse/plant assigned."}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ mt: 3 }}>
          {filteredWarehouses.map((warehouse) => {
            const { items, summary } = warehousesData[warehouse];
            const isExpanded = expandedWarehouse === warehouse;
            const filteredItems = searchTerm
              ? items.filter(
                  (item) =>
                    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.materialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : items;

            return (
              <Accordion
                key={warehouse}
                expanded={isExpanded}
                onChange={() => handleExpand(warehouse)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown />}
                  sx={{
                    backgroundColor: isExpanded ? "primary.light" : "background.paper",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                    <Factory size={24} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {warehouse}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {warehousesData[warehouse].plantCode && warehousesData[warehouse].plantCode !== warehouse && (
                          <span>Plant Code: {warehousesData[warehouse].plantCode} • </span>
                        )}
                        {summary.totalItems} items • Total Stock: {summary.totalStock.toLocaleString()} • Low Stock: {summary.lowStock} • Out of Stock: {summary.outOfStock}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      {summary.lowStock > 0 && (
                        <Chip label={`${summary.lowStock} Low Stock`} size="small" color="warning" />
                      )}
                      {summary.outOfStock > 0 && (
                        <Chip label={`${summary.outOfStock} Out of Stock`} size="small" color="error" />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {filteredItems.length === 0 ? (
                    <Alert severity="info">No materials found for this warehouse</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Current Stock</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Reorder Level</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredItems.map((item, index) => {
                            const stock = item.stock ?? 0;
                            const minStock = item.minStock ?? item.reorderLevel ?? 0;
                            const status = getStockStatus(stock, minStock);

                            return (
                              <TableRow key={item.id || index} hover>
                                <TableCell>{item.name || item.materialName || "N/A"}</TableCell>
                                <TableCell>{item.materialNumber || item.materialCode || "N/A"}</TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {stock.toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{minStock || "—"}</TableCell>
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
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
