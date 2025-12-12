import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
import { Search, RefreshCw, CheckCircle, XCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { orderAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function RegionalOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchOrders = async () => {
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

      const data = await orderAPI.getAllOrders(params);
      setOrders(data.data || data.orders || data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, searchTerm, statusFilter]);

  const handleApprove = async (orderId) => {
    try {
      await orderAPI.approveOrder(orderId, { action: "approve" });
      toast.success("Order approved successfully");
      fetchOrders();
    } catch (error) {
      console.error("Failed to approve order:", error);
      toast.error(error.response?.data?.error || "Failed to approve order");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await orderAPI.rejectOrder(selectedOrder.id, {
        action: "reject",
        reason: rejectReason,
        remarks: rejectReason,
      });
      toast.success("Order rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Failed to reject order:", error);
      toast.error(error.response?.data?.error || "Failed to reject order");
    }
  };

  const openRejectDialog = (order) => {
    setSelectedOrder(order);
    setRejectDialogOpen(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      draft: "default",
    };
    return colors[status] || "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional Orders"
        subtitle="View and manage orders in your region"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search orders..."
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
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={() => fetchOrders()}>
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
                  <TableCell>Order #</TableCell>
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
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.orderNumber || order.id}</TableCell>
                      <TableCell>
                        {order.dealer?.businessName || order.dealerName || "N/A"}
                      </TableCell>
                      <TableCell>
                        ₹{Number(order.totalAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status || order.approvalStatus || "pending"}
                          size="small"
                          color={getStatusColor(order.status || order.approvalStatus)}
                        />
                      </TableCell>
                      <TableCell>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            <Eye size={16} />
                          </IconButton>
                          {(order.status === "pending" ||
                            order.approvalStatus === "pending") && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle size={14} />}
                                onClick={() => handleApprove(order.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<XCircle size={14} />}
                                onClick={() => openRejectDialog(order)}
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
        <DialogTitle>Reject Order</DialogTitle>
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

