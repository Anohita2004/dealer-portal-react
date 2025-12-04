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
  CircularProgress,
  TextField,
} from "@mui/material";
import { orderAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminOrders() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const res = await orderAPI.getAllOrders({ role });
      setOrders(res?.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [role]);

  const approve = async (orderId) => {
    if (!window.confirm("Approve this order?")) return;
    try {
      await orderAPI.approveOrder(orderId, role);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to approve order");
    }
  };

  const reject = async (orderId) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      await orderAPI.rejectOrder(orderId, reason, role);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to reject order");
    }
  };

  const statusColor = { Pending: "warning", Approved: "success", Rejected: "error" };

  // Flatten orders for display
  const rows = orders
    .filter((o) => !o.nextStage || o.nextStage?.toLowerCase() === role) // include undefined nextStage
    .flatMap((order) =>
      (order.items || []).map((item) => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        nextStage: order.nextStage,
        materialName: item.material?.name || "Unknown Material",
        qty: item.qty,
      }))
    )
    .filter(
      (row) =>
        row.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        row.materialName.toLowerCase().includes(search.toLowerCase())
    );

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
          <Box mb={2}>
            <TextField
              label="Search by Order No or Material"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
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
                {rows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.orderNumber}</TableCell>
                    <TableCell>{row.materialName}</TableCell>
                    <TableCell>{row.qty}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={statusColor[row.status] || "default"} />
                    </TableCell>
                    <TableCell>
                      {row.status === "Pending" && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => approve(row.orderId)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => reject(row.orderId)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
