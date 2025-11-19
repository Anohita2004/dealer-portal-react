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
import { orderAPI, materialAPI } from "../../services/api";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Get all materials (cache them by ID)
        const mres = await materialAPI.getMaterials();
        const matMap = {};
        (mres?.materials || []).forEach(m => {
          matMap[m.id] = m;
        });
        setMaterials(matMap);

        // 2. Load orders
        const ores = await orderAPI.getMyOrders();
        setOrders(ores?.orders || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  const statusColor = {
    Pending: "warning",
    Approved: "success",
    Rejected: "error",
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
                <TableCell>Order Number</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {orders.map(order =>
                (order.order_items || []).map(item => {
                  const mat = materials[item.materialId] || {};
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{mat.name || "Unknown Material"}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={statusColor[order.status] || "default"}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
