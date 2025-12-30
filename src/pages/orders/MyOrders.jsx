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
import { orderAPI, materialAPI, invoiceAPI, userAPI, dealerAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getRoleName } from "../../utils/authUtils";
import { getOrderLifecycleStatus, getInventoryImpact, getApprovalProgress } from "../../utils/orderLifecycle";
import { Clock, AlertCircle, CheckCircle, XCircle, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState({});
  const [openOrder, setOpenOrder] = useState(null); // order object for modal
  const [submitting, setSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  const [workflows, setWorkflows] = useState({}); // Store workflow data per order
  const [approvers, setApprovers] = useState({}); // Store approver info per order: { orderId: { name, role } }
  const [dealerAdminApprover, setDealerAdminApprover] = useState(null); // For dealer_staff creator → their dealer_admin manager
  const { user: currentUser } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Load materials (dealer-scoped for dealer / sales roles)
        const role = getRoleName(currentUser)?.toLowerCase?.() || (currentUser?.role || "").toLowerCase();
        let mres;
        if (
          (role === "dealer_admin" || role === "dealer_staff" || role === "sales_executive") &&
          currentUser?.dealerId
        ) {
          mres = await materialAPI.getDealerMaterials(currentUser.dealerId);
        } else {
          mres = await materialAPI.getMaterials();
        }
        const list = mres?.materials || mres?.data?.materials || mres?.data || mres || [];
        const matMap = {};
        (Array.isArray(list) ? list : []).forEach((m) => {
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

        // 4. Load approver information for pending orders (generic, by stage/manager)
        const approverPromises = (Array.isArray(ordersList) ? ordersList : [])
          .filter((order) => {
            const workflow = workflowMap[order.id];
            const isPending =
              workflow?.approvalStatus === "pending" ||
              order.approvalStatus === "pending" ||
              order.status === "pending";
            return isPending && (order.dealerId || order.dealer?.id);
          })
          .map(async (order) => {
            try {
              const workflow = workflowMap[order.id];
              const currentStage = workflow?.currentStage || order.approvalStage || order.currentStage;

              if (!currentStage) return { orderId: order.id, approver: null };

              const dealerId = order.dealerId || order.dealer?.id;

              // For non-dealer_admin stages (territory_manager, area_manager, etc.), try dealer.managerId
              if (currentStage !== "dealer_admin" && dealerId) {
                const dealerRes = await dealerAPI.getDealerById(dealerId).catch(() => null);
                const dealer = dealerRes?.dealer || dealerRes?.data || dealerRes;

                if (dealer?.managerId) {
                  const managerRes = await userAPI.getUserById(dealer.managerId).catch(() => null);
                  const manager = managerRes?.user || managerRes?.data || managerRes;

                  if (manager) {
                    const roleName = manager.role?.name || manager.role || currentStage;
                    const formattedRole = roleName
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ");

                    return {
                      orderId: order.id,
                      approver: {
                        name: manager.name || manager.username || formattedRole,
                        role: formattedRole,
                      },
                    };
                  }
                }
              }

              // Fallback: just show the role name
              const formattedRole = currentStage
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

              return {
                orderId: order.id,
                approver: {
                  name: formattedRole,
                  role: formattedRole,
                },
              };
            } catch (err) {
              console.debug("Could not fetch approver for order:", order.id, err);
              return { orderId: order.id, approver: null };
            }
          });

        const approverResults = await Promise.all(approverPromises);
        const approverMap = {};
        approverResults.forEach(({ orderId, approver }) => {
          if (approver) approverMap[orderId] = approver;
        });
        setApprovers(approverMap);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  // Use lifecycle-aware status utility instead of hardcoded colors

  // Load the specific dealer_admin manager for this dealer_staff (if any)
  useEffect(() => {
    const loadDealerAdminApprover = async () => {
      try {
        const role = (currentUser?.role || "").toLowerCase();
        if (role !== "dealer_staff" || !currentUser?.managerId) return;

        const res = await userAPI.getUserById(currentUser.managerId).catch(() => null);
        const manager = res?.user || res?.data || res;
        if (!manager) return;

        setDealerAdminApprover({
          name: manager.name || manager.username || "Dealer Admin",
          role: "Dealer Admin",
        });
      } catch (err) {
        console.debug("Could not load dealer admin approver for current user:", err);
      }
    };

    loadDealerAdminApprover();
  }, [currentUser]);

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

                // Determine which role/stage is currently responsible for approval
                const currentStage =
                  workflow?.currentStage ||
                  lifecycleStatus.approvalStage ||
                  order.approvalStage ||
                  order.currentStage;

                const formatStageName = (stage) => {
                  if (!stage) return null;
                  return stage
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
                };

                // Get approver info for this order
                let approver = approvers[order.id];
                // For dealer_staff creator, if stage is dealer_admin, use their assigned dealer_admin manager
                if (
                  currentStage === "dealer_admin" &&
                  (currentUser?.role || "").toLowerCase() === "dealer_staff" &&
                  dealerAdminApprover
                ) {
                  approver = dealerAdminApprover;
                }
                const pendingApproverLabel =
                  (workflow?.approvalStatus === "pending" ||
                    lifecycleStatus.lifecycleStage === "pending_approval" ||
                    order.approvalStatus === "pending" ||
                    order.status === "pending") && currentStage
                    ? approver
                      ? `Waiting for ${approver.name} (${approver.role}) approval`
                      : `Waiting for ${formatStageName(currentStage)} approval`
                    : null;
                const inventoryImpact = getInventoryImpact(order);

                // join material names for display
                const materialsText = (order.items || [])
                  .map(
                    (it) =>
                      it.materialName ||
                      materials[it.materialId]?.name ||
                      "Unknown"
                  )
                  .join(", ");

                const totalQty = (order.items || []).reduce(
                  (s, it) => s + Number(it.qty || 0),
                  0
                );

                // Allow "Raise Invoice" ONLY when the order is fully approved in workflow terms
                const isDealerStaff = (currentUser?.role || "").toLowerCase() === "dealer_staff";
                const isLifecycleApproved = lifecycleStatus.lifecycleStage === "approved";
                const isWorkflowApproved =
                  workflow?.approvalStatus === "approved" ||
                  order.approvalStatus === "approved" ||
                  order.status === "approved";

                const canRaiseInvoice = isDealerStaff && isLifecycleApproved && isWorkflowApproved;

                // Check if order can be tracked (Shipped status or assignment in transit)
                const orderStatus = order.status;
                const assignmentStatus = order.truckAssignment?.status;
                const canTrackOrder = 
                  orderStatus === 'Shipped' || 
                  assignmentStatus === 'in_transit' || 
                  assignmentStatus === 'picked_up' ||
                  assignmentStatus === 'assigned';

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
                      {pendingApproverLabel && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5, fontSize: "0.7rem" }}
                        >
                          {pendingApproverLabel}
                        </Typography>
                      )}
                      {lifecycleStatus.isBlocked && lifecycleStatus.blockingReason && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontSize: "0.7rem" }}>
                          {lifecycleStatus.blockingReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {canTrackOrder && (
                          <Button
                            variant="contained"
                            color="info"
                            size="small"
                            startIcon={<MapPin size={16} />}
                            onClick={() => navigate(`/orders/${order.id}/track`)}
                          >
                            Track Order
                          </Button>
                        )}
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
                      </Box>
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