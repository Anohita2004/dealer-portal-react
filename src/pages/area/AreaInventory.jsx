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
  TextField,
  InputAdornment,
  Button,
  Pagination,
  Stack,
  IconButton,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import { Search, RefreshCw, Download } from "lucide-react";
import { inventoryAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function AreaInventory() {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        areaId: user.areaId,
      };

      const data = await inventoryAPI.getSummary(params);
      setInventory(data.data || data.inventory || data || []);
      setSummary(data.summary || null);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      toast.error("Failed to load inventory");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, searchTerm]);

  const handleExport = async () => {
    try {
      const blob = await inventoryAPI.exportInventory("excel");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `area-inventory-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Inventory exported successfully");
    } catch (error) {
      console.error("Failed to export inventory:", error);
      toast.error("Failed to export inventory. Please try again later.");
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock <= 0) return { label: "Out of Stock", color: "error" };
    if (stock < minStock) return { label: "Low Stock", color: "warning" };
    return { label: "In Stock", color: "success" };
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Area Inventory Overview"
        subtitle="View inventory levels across your area"
      />

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {summary.totalItems || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {summary.inStock || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Stock
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {summary.lowStock || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Low Stock
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {summary.outOfStock || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Out of Stock
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<Download size={18} />}
              onClick={handleExport}
            >
              Export
            </Button>
            <IconButton onClick={() => fetchInventory()}>
              <RefreshCw size={18} />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Material Name</TableCell>
                  <TableCell>Plant</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Min Stock</TableCell>
                  <TableCell>UOM</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No inventory found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => {
                    const status = getStockStatus(item.stock, item.minStock);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.name || item.materialName || "N/A"}</TableCell>
                        <TableCell>{item.plant || "N/A"}</TableCell>
                        <TableCell>{item.stock || 0}</TableCell>
                        <TableCell>{item.minStock || 0}</TableCell>
                        <TableCell>{item.uom || "N/A"}</TableCell>
                        <TableCell>
                          <Chip label={status.label} size="small" color={status.color} />
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
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

