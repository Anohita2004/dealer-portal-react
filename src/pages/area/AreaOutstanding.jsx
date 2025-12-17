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
  Typography,
} from "@mui/material";
import { Search, RefreshCw, Download } from "lucide-react";
import { reportAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function AreaOutstanding() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        areaId: user.areaId,
      };

      const result = await reportAPI.getOutstandingReceivables(params);
      const payments = result.data || result.payments || result || [];
      setData(payments);
      setTotalOutstanding(
        payments.reduce((sum, p) => sum + Number(p.outstanding || 0), 0)
      );
      setTotalPages(result.totalPages || Math.ceil((result.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch outstanding payments:", error);
      toast.error("Failed to load outstanding payments");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm]);

  const handleExport = async () => {
    try {
      const blob = await reportAPI.exportExcel("area-outstanding", {});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `area-outstanding-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
        title="Area Outstanding"
        subtitle={`Total Outstanding: ₹${totalOutstanding.toLocaleString()}`}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search dealers..."
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
                  <TableCell>Dealer</TableCell>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Invoice Amount</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Due Date</TableCell>
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
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No outstanding payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.dealerName || item.businessName || "N/A"}</TableCell>
                      <TableCell>{item.invoiceNumber || "N/A"}</TableCell>
                      <TableCell>₹{Number(item.invoiceAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(item.outstanding || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {item.dueDate
                          ? new Date(item.dueDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status || "Outstanding"}
                          size="small"
                          color={item.status === "Overdue" ? "error" : "warning"}
                        />
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

