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
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { orderAPI, materialAPI, invoiceAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getOrderLifecycleStatus, getInventoryImpact, getApprovalProgress } from "../../utils/orderLifecycle";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState({});
  const [openOrder, setOpenOrder] = useState(null); // order object for modal
  const [submitting, setSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  const [workflows, setWorkflows] = useState({}); // Store workflow data per order
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
        const ordersList = ores?.orders || ores?.data || ores || [];
        setOrders(Array.isArray(ordersList) ? ordersList : []);

        // 3. Load workflow data for orders to show approval progress
        const workflowPromises = (Array.isArray(ordersList) ? ordersList : [])
          .filter((order) => order.id)
          .map(async (order) => {
            try {
              const workflowRes = await orderAPI.getWorkflowStatus(order.id);
              return {
                orderId: order.id,
                workflow: workflowRes.workflow || workflowRes.data || workflowRes,
              };
            } catch (err) {
              // Silently fail - workflow data is optional
              return { orderId: order.id, workflow: null };
            }
          });

        const workflowResults = await Promise.all(workflowPromises);
        const workflowMap = {};
        workflowResults.forEach(({ orderId, workflow }) => {
          if (workflow) workflowMap[orderId] = workflow;
        });
        setWorkflows(workflowMap);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  // Use lifecycle-aware status utility instead of hardcoded colors

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
                // Get lifecycle-aware status from backend intelligence
                const lifecycleStatus = getOrderLifecycleStatus(order);
                const workflow = workflows[order.id];
                const approvalProgress = getApprovalProgress(workflow);
                const inventoryImpact = getInventoryImpact(order);

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
                  lifecycleStatus.lifecycleStage === "approved";

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {order.orderNumber || order.id?.slice(0, 8)}
                        </Typography>
                        {workflow && approvalProgress > 0 && approvalProgress < 100 && (
                          <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={approvalProgress}
                              sx={{ flex: 1, height: 4, borderRadius: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                              {approvalProgress}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{materialsText || "—"}</Typography>
                        {inventoryImpact?.hasLowStock && (
                          <Chip
                            label="Low Stock Impact"
                            size="small"
                            color="warning"
                            sx={{ mt: 0.5, fontSize: "0.65rem", height: 20 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{totalQty}</TableCell>
                    <TableCell>
                      <Tooltip title={lifecycleStatus.description}>
                        <Chip
                          label={lifecycleStatus.label}
                          color={lifecycleStatus.color}
                          size="small"
                          icon={
                            lifecycleStatus.isBlocked ? (
                              <AlertCircle size={14} />
                            ) : lifecycleStatus.lifecycleStage === "approved" ? (
                              <CheckCircle size={14} />
                            ) : lifecycleStatus.lifecycleStage === "rejected" ? (
                              <XCircle size={14} />
                            ) : (
                              <Clock size={14} />
                            )
                          }
                        />
                      </Tooltip>
                      {lifecycleStatus.isBlocked && lifecycleStatus.blockingReason && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: "0.7rem" }}>
                          {lifecycleStatus.blockingReason}
                        </Typography>
                      )}
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
                        <Tooltip title={lifecycleStatus.isBlocked ? lifecycleStatus.blockingReason : "Insufficient role"}>
                          <span>
                            <Button
                              variant="outlined"
                              size="small"
                              disabled
                            >
                              Raise Invoice
                            </Button>
                          </span>
                        </Tooltip>
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