import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search, Filter } from "lucide-react";
import { orderAPI, dashboardAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import OrderApprovalCard from "../../components/OrderApprovalCard";
import PageHeader from "../../components/PageHeader";
import { toast } from "react-toastify";

export default function AdminOrders() {
  const { user } = useAuth();
  const role = user?.role;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // pending, all, approved, rejected
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ===== Fetch orders for this user =====
  const fetchOrders = async () => {
    if (!role) return;
    setLoading(true);
    try {
      let res;

      if (role === "dealer_admin") {
        // Dealer admin: use dedicated pending orders endpoint
        // Backend: GET /api/orders/pending (scoped to this dealer_admin's approvals)
        res = await orderAPI.getPendingOrders();
      } else {
        // Managers / super_admin / regional_admin: use filtered orders endpoint
        // Backend: GET /api/orders?status=pending (scoped by role & hierarchy)
        res = await orderAPI.getPendingApprovals();
      }

      const ordersList = res.orders || res.data || res || [];
      setOrders(Array.isArray(ordersList) ? ordersList : []);
    } catch (err) {
      // Suppress console errors for 403 (permission denied)
      if (err.response?.status !== 403) {
        console.error(err);
        toast.error(err.response?.data?.error || "Failed to fetch orders");
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [role]);

  // ===== Approve order =====
  const approve = async (orderId) => {
    try {
      await orderAPI.approveOrder(orderId, { action: "approve" });
      toast.success("Order approved successfully");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to approve order");
    }
  };

  // ===== Reject order =====
  const reject = async (orderId, rejectionReason) => {
    if (!rejectionReason) return;

    try {
      await orderAPI.rejectOrder(orderId, { action: "reject", reason: rejectionReason, remarks: rejectionReason });
      toast.success("Order rejected");
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to reject order");
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter === "pending" && order.status !== "pending" && order.approvalStatus !== "pending") {
      return false;
    }
    if (statusFilter === "approved" && order.status !== "approved" && order.approvalStatus !== "approved") {
      return false;
    }
    if (statusFilter === "rejected" && order.status !== "rejected" && order.approvalStatus !== "rejected") {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(query) ||
        order.dealer?.businessName?.toLowerCase().includes(query) ||
        order.dealerName?.toLowerCase().includes(query) ||
        order.id?.toString().includes(query)
      );
    }

    return true;
  });

  // Sort orders by SLA urgency (backend intelligence: prioritize overdue and due soon)
  // Note: This will be enhanced when workflow data is available in list view
  // For now, pending orders are shown first, and OrderApprovalCard will fetch and display SLA per item
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Prioritize pending orders
    const aPending = a.status === "pending" || a.approvalStatus === "pending";
    const bPending = b.status === "pending" || b.approvalStatus === "pending";
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    
    // Within pending, sort by creation date (newest first for now)
    // TODO: When backend provides SLA in list response, sort by SLA expiration
    if (aPending && bPending) {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return bDate - aDate;
    }
    
    return 0;
  });

  // ===== Status colors =====
  const statusColor = {
    draft: "default",
    pending: "warning",
    approved: "success",
    rejected: "error",
  };

  if (loading) {
    return (
      <Box p={4}>
        <Typography>Loading orders...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader
        title={
          role === "regional_manager"
            ? "Regional Manager Order Tracking"
            : role === "regional_admin"
            ? "Regional Admin Approval Panel"
            : role === "super_admin"
            ? "Super Admin Approval Panel"
            : "Dealer Orders (Approval Panel)"
        }
        subtitle={
          role === "regional_manager"
            ? `${filteredOrders.length} order(s) currently in workflow for your assigned dealers`
            : `${filteredOrders.length} order(s) ${
                statusFilter === "pending" ? "pending" : ""
              } for approval`
        }
      />

      {/* Filters */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />

        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => setStatusFilter(newValue)}
          sx={{ flex: 1 }}
        >
          <Tab label="Pending" value="pending" />
          <Tab label="All" value="all" />
          <Tab label="Approved" value="approved" />
          <Tab label="Rejected" value="rejected" />
        </Tabs>

        <Button
          variant="outlined"
          size="small"
          onClick={fetchOrders}
          startIcon={<Filter size={16} />}
        >
          Refresh
        </Button>
      </Box>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {searchQuery || statusFilter !== "all"
                ? "No orders match your filters"
                : "No orders pending for your approval"}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sortedOrders.map((order) => (
            <OrderApprovalCard
              key={order.id}
              order={order}
              onUpdate={fetchOrders}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
