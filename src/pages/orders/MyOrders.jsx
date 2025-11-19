import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@mui/material";
import { orderAPI } from "../../services/api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    orderAPI.getMyOrders().then(setOrders).catch(console.error);
  }, []);

  const statusColor = {
    pending: "warning",
    approved: "success",
    rejected: "error",
  };

  return (
    <Box p={4}>
      <Typography variant="h5" mb={3}>
        My Orders
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
              </TableRow>
            </TableHead>

            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.material?.name}</TableCell>
                  <TableCell>{o.quantity}</TableCell>
                  <TableCell>
                    <Chip
                      label={o.status}
                      color={statusColor[o.status] || "default"}
                    />
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
