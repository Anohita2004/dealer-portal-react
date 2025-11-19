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

  const fetchOrders = () => {
  orderAPI
    .getAllOrders()
    .then((res) => {
      const list = Array.isArray(res) ? res : res.rows ? res.rows : [];
      setOrders(list);
    })
    .catch(console.error);
};



  useEffect(() => {
    fetchOrders();
  }, []);

  const updateQuantity = async (id) => {
    try {
      await orderAPI.updateOrder(id, { quantity: Number(editQty[id]) });
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
                <TableCell>Order ID</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.material?.name}</TableCell>

                  <TableCell>
                    {o.status === "pending" ? (
                      <TextField
                        size="small"
                        value={editQty[o.id] ?? o.quantity}
                        onChange={(e) =>
                          setEditQty({ ...editQty, [o.id]: e.target.value })
                        }
                        type="number"
                      />
                    ) : (
                      o.quantity
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={o.status}
                      color={
                        o.status === "approved"
                          ? "success"
                          : o.status === "rejected"
                          ? "error"
                          : "warning"
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {o.status === "pending" && (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => updateQuantity(o.id)}
                          sx={{ mr: 1 }}
                        >
                          Update
                        </Button>

                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => approve(o.id)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>

                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => reject(o.id)}
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
        </CardContent>
      </Card>
    </Box>
  );
}
