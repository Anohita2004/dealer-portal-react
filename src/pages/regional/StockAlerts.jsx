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
  Alert,
} from "@mui/material";
import { Search, RefreshCw, Download, AlertTriangle } from "lucide-react";
import { materialAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        regionId: user.regionId,
      };

      const data = await materialAPI.getAlerts(params);
      setAlerts(data.data || data.alerts || data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch stock alerts:", error);
      toast.error("Failed to load stock alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, searchTerm]);

  const getAlertSeverity = (alert) => {
    if (alert.stock <= 0) return { severity: "error", label: "Out of Stock" };
    if (alert.stock < alert.minStock) return { severity: "warning", label: "Low Stock" };
    return { severity: "info", label: "Alert" };
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Stock Alerts"
        subtitle="Monitor stock levels and alerts in your region"
      />

      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>{alerts.length}</strong> stock alert{alerts.length !== 1 ? "s" : ""} require
          attention
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
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
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <IconButton onClick={() => fetchAlerts()}>
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
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Min Stock</TableCell>
                  <TableCell>Alert Type</TableCell>
                  <TableCell>UOM</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No stock alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => {
                    const alertInfo = getAlertSeverity(alert);
                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <AlertTriangle size={16} color={alertInfo.severity === "error" ? "red" : "orange"} />
                            <span>{alert.materialName || alert.name || "N/A"}</span>
                          </Stack>
                        </TableCell>
                        <TableCell>{alert.plant || "N/A"}</TableCell>
                        <TableCell>{alert.stock || 0}</TableCell>
                        <TableCell>{alert.minStock || 0}</TableCell>
                        <TableCell>
                          <Chip
                            label={alertInfo.label}
                            size="small"
                            color={alertInfo.severity}
                          />
                        </TableCell>
                        <TableCell>{alert.uom || "N/A"}</TableCell>
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

