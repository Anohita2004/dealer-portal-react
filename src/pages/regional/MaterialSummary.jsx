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
  Grid,
  Typography,
} from "@mui/material";
import { Search, RefreshCw, Download, Package } from "lucide-react";
import { materialAPI, reportAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function MaterialSummary() {
  const [materials, setMaterials] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        regionId: user.regionId,
      };

      const [materialsData, analyticsData] = await Promise.all([
        materialAPI.getMaterials(params).catch(() => ({ data: [] })),
        materialAPI.getAnalytics(params).catch(() => (null)),
      ]);

      setMaterials(materialsData.data || materialsData.materials || materialsData || []);
      setSummary(analyticsData);
      setTotalPages(materialsData.totalPages || Math.ceil((materialsData.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      toast.error("Failed to load materials");
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [page, searchTerm]);

  const handleExport = async () => {
    try {
      const blob = await reportAPI.exportExcel("material-summary", {});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `material-summary-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Material summary exported successfully");
    } catch (error) {
      console.error("Failed to export materials:", error);
      toast.error("Failed to export materials. Please try again later.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Material Summary"
        subtitle="View material inventory summary for your region"
      />

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {summary.totalMaterials || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Materials
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
              placeholder="Search materials..."
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
            <IconButton onClick={() => fetchMaterials()}>
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
                  <TableCell>Material Code</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell>UOM</TableCell>
                  <TableCell>Stock</TableCell>
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
                ) : materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No materials found
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>{material.name || material.materialName || "N/A"}</TableCell>
                      <TableCell>{material.materialCode || material.code || "N/A"}</TableCell>
                      <TableCell>{material.group || material.materialGroup || "N/A"}</TableCell>
                      <TableCell>{material.uom || "N/A"}</TableCell>
                      <TableCell>{material.stock || 0}</TableCell>
                      <TableCell>
                        {material.stock > 0 ? "Available" : "Unavailable"}
                      </TableCell>
                    </TableRow>
                  ))
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

