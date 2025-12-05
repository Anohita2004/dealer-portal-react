import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@mui/material";
import { orderAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminOrders() {
  const { user } = useAuth();
  const role = user?.role;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== Fetch orders for this user =====
  const fetchOrders = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const res = await orderAPI.getAllOrders(role);
      console.log("Fetched orders:", res.orders);

      // Show orders that are pending for this role
      const filtered = (res.orders || []).filter((o) => {
        // If approvalStage is null, show to all allowed roles
        if (!o.approvalStage) return true;
        return o.approvalStage.toLowerCase() === role?.toLowerCase();
      });

      setOrders(filtered);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch orders");
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
      await orderAPI.approveOrder(orderId, role);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to approve order");
    }
  };

  // ===== Reject order =====
  const reject = async (orderId) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;

    try {
      await orderAPI.rejectOrder(orderId, reason, role);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to reject order");
    }
  };

  // ===== Status colors =====
  const statusColor = {
    draft: "default",
    pending: "warning",
    approved: "success",
    rejected: "error",
  };

  if (loading) return <Typography>Loading orders...</Typography>;

  return (
    <Box p={4}>
      <Typography variant="h5" mb={3}>
        {role === "regional_manager"
          ? "Regional Manager Approval Panel"
          : role === "regional_admin"
          ? "Regional Admin Approval Panel"
          : role === "super_admin"
          ? "Super Admin Approval Panel"
          : "Dealer Orders (Approval Panel)"}
      </Typography>

      <Card>
        <CardContent>
          {orders.length === 0 ? (
            <Typography>No orders pending for your approval.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order No</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {orders.map((order) => {
                  const items =
                    order.items && order.items.length
                      ? order.items
                      : [{ id: "dummy", material: { name: "N/A" }, qty: 0 }];

                  const status =
                    (order.approvalStatus || order.status || "").toLowerCase();

                  const canAct = status === "pending" || status === "draft";

                  return items.map((item) => (
                    <TableRow key={order.id + "_" + item.id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{item.material?.name || "Unknown Material"}</TableCell>
                      <TableCell>{item.qty || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.approvalStatus || order.status}
                          color={statusColor[status] || "default"}
                        />
                      </TableCell>
                      <TableCell>
                        {canAct ? (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => approve(order.id)}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => reject(order.id)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No actions available
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
