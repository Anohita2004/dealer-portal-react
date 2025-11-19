import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  const [editQty, setEditQty] = useState({});

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

  const updateQuantity = async (orderId, itemId) => {
    try {
      await orderAPI.updateOrder(orderId, {
        itemId,
        qty: Number(editQty[itemId]),
      });

      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to update quantity");
    }
  };

  const approve = async (id) => {
    await orderAPI.approveOrder(id);
    fetchOrders();
  };

  const reject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;

    await orderAPI.rejectOrder(id, { reason });
    fetchOrders();
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

                    <TableCell>
                      {item.material?.name || "Unknown Material"}
                    </TableCell>

                    <TableCell>
                      {order.status === "Pending" ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editQty[item.id] ?? item.qty}
                          onChange={(e) =>
                            setEditQty({
                              ...editQty,
                              [item.id]: e.target.value,
                            })
                          }
                        />
                      ) : (
                        item.qty
                      )}
                    </TableCell>

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
                            color="primary"
                            size="small"
                            onClick={() =>
                              updateQuantity(order.id, item.id)
                            }
                            sx={{ mr: 1 }}
                          >
                            Update
                          </Button>

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
