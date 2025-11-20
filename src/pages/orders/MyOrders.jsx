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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { orderAPI, materialAPI, invoiceAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState({});
  const [openOrder, setOpenOrder] = useState(null); // order object for modal
  const [submitting, setSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Load materials
        const mres = await materialAPI.getMaterials();
        const matMap = {};
        (mres?.materials || []).forEach((m) => {
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

  const refreshOrders = async () => {
    try {
      const ores = await orderAPI.getMyOrders();
      setOrders(ores?.orders || []);
    } catch (err) {
      console.error("refreshOrders:", err);
    }
  };

  const handleOpenRaise = (order) => {
    setOpenOrder(order);
    setTotalAmount(order.totalAmount || "");
    setDescription("");
  };

  const handleCloseModal = () => {
    setOpenOrder(null);
    setSubmitting(false);
  };

  const handleSubmitInvoice = async () => {
    if (!openOrder) return;
    setSubmitting(true);
    try {
      const payload = {
        orderId: openOrder.id,
        // optional overrides — backend will derive totalAmount if omitted
        totalAmount: totalAmount ? Number(totalAmount) : undefined,
        description: description || undefined,
      };

      // invoiceAPI.createInvoice should POST to /api/invoices and handle auth headers
      await invoiceAPI.createInvoice(payload);

      setSnack({
        open: true,
        severity: "success",
        message: "Invoice created successfully",
      });

      handleCloseModal();
      await refreshOrders();
    } catch (err) {
      console.error("create invoice error:", err);
      const errMsg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create invoice";
      setSnack({ open: true, severity: "error", message: errMsg });
      setSubmitting(false);
    }
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
                <TableCell>Materials</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {orders.map((order) => {
                // join material names for display
                const materialsText = (order.items || [])
                  .map((it) => materials[it.materialId]?.name || "Unknown")
                  .join(", ");

                const totalQty = (order.items || []).reduce(
                  (s, it) => s + Number(it.qty || 0),
                  0
                );

                const canRaiseInvoice =
                  (currentUser?.role || "").toLowerCase() === "dealer_staff" &&
                  order?.status === "Approved";

                return (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{materialsText || "—"}</TableCell>
                    <TableCell>{totalQty}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={statusColor[order.status] || "default"}
                      />
                    </TableCell>
                    <TableCell>
                      {canRaiseInvoice ? (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleOpenRaise(order)}
                        >
                          Raise Invoice
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled
                          title={
                            order.status !== "Approved"
                              ? "Order not approved"
                              : "Insufficient role"
                          }
                        >
                          Raise Invoice
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Raise Invoice Dialog */}
      <Dialog open={!!openOrder} onClose={handleCloseModal}>
        <DialogTitle>
          {openOrder ? `Raise Invoice for ${openOrder.orderNumber}` : "Raise Invoice"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Total Amount"
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            fullWidth
            margin="normal"
            helperText="Leave blank to use order total"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitInvoice}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}