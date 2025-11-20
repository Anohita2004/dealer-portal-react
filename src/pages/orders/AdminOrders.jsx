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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getAllOrders();
      setOrders(res?.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const approve = async (id) => {
    try {
      await orderAPI.approveOrder(id);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to approve");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;

    try {
      await orderAPI.rejectOrder(id, reason);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to reject");
    }
  };

  const statusColor = {
    Pending: "warning",
    Approved: "success",
    Rejected: "error",
  };

  return (
    <Box p={4}>
      <Typography variant="h5" mb={3}>
        Dealer Orders (Approval Panel)
      </Typography>

      <Card>
        <CardContent>
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
              {orders.map((order) =>
                (order.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{item.material?.name || "Unknown Material"}</TableCell>
                    <TableCell>{item.qty}</TableCell>

                    <TableCell>
                      <Chip
                        label={order.status}
                        color={statusColor[order.status] || "default"}
                      />
                    </TableCell>

                    <TableCell>
                      {order.status === "Pending" && (
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
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
