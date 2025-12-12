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
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Search, RefreshCw, CheckCircle, XCircle, Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { invoiceAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function RegionalInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        regionId: user.regionId,
      };

      const data = await invoiceAPI.getInvoices(params);
      setInvoices(data.data || data.invoices || data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, searchTerm, statusFilter]);

  const handleApprove = async (invoiceId) => {
    try {
      await invoiceAPI.approveInvoice(invoiceId, { action: "approve" });
      toast.success("Invoice approved successfully");
      fetchInvoices();
    } catch (error) {
      console.error("Failed to approve invoice:", error);
      toast.error(error.response?.data?.error || "Failed to approve invoice");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await invoiceAPI.rejectInvoice(selectedInvoice.id, {
        action: "reject",
        reason: rejectReason,
        remarks: rejectReason,
      });
      toast.success("Invoice rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error("Failed to reject invoice:", error);
      toast.error(error.response?.data?.error || "Failed to reject invoice");
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const blob = await invoiceAPI.downloadPDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Failed to download invoice PDF");
    }
  };

  const openRejectDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      paid: "info",
    };
    return colors[status] || "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Invoices"
        subtitle="View and manage invoices in your region"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search invoices..."
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

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={() => fetchInvoices()}>
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
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Dealer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber || invoice.id}</TableCell>
                      <TableCell>
                        {invoice.dealer?.businessName || invoice.dealerName || "N/A"}
                      </TableCell>
                      <TableCell>
                        ₹{Number(invoice.totalAmount || invoice.baseAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status || invoice.approvalStatus || "pending"}
                          size="small"
                          color={getStatusColor(invoice.status || invoice.approvalStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        {invoice.invoiceDate || invoice.createdAt
                          ? new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            <Eye size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadPDF(invoice.id)}
                          >
                            <Download size={16} />
                          </IconButton>
                          {(invoice.status === "pending" ||
                            invoice.approvalStatus === "pending") && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle size={14} />}
                                onClick={() => handleApprove(invoice.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<XCircle size={14} />}
                                onClick={() => openRejectDialog(invoice)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </Stack>
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Invoice</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            sx={{ mt: 2, minWidth: 400 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

