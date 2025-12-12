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
} from "@mui/material";
import { Search, RefreshCw, Download } from "lucide-react";
import { reportAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function TerritoryPerformance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        startDate,
        endDate,
        regionId: user.regionId,
      };

      const result = await reportAPI.getTerritoryReport(params);
      setData(result.data || result.territories || result || []);
      setTotalPages(result.totalPages || Math.ceil((result.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch territory performance:", error);
      toast.error("Failed to load territory performance data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm, startDate, endDate]);

  const handleExport = async () => {
    try {
      const blob = await reportAPI.exportExcel("territory-performance", {
        startDate,
        endDate,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `territory-performance-${startDate}-${endDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Failed to export report:", error);
      toast.error("Failed to export report");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Territory Performance"
        subtitle="View performance metrics by territory"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              placeholder="Search territories..."
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
            <IconButton onClick={() => fetchData()}>
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
                  <TableCell>Territory</TableCell>
                  <TableCell>Total Sales</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Dealers</TableCell>
                  <TableCell>Outstanding</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id || item.territoryId}>
                      <TableCell>{item.territoryName || item.name || "N/A"}</TableCell>
                      <TableCell>₹{Number(item.totalSales || 0).toLocaleString()}</TableCell>
                      <TableCell>{item.totalOrders || 0}</TableCell>
                      <TableCell>{item.dealerCount || 0}</TableCell>
                      <TableCell>₹{Number(item.outstanding || 0).toLocaleString()}</TableCell>
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

