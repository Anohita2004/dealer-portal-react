import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { ArrowLeft, Download, AlertCircle, Package, Receipt, CreditCard, CheckCircle, Clock } from "lucide-react";
import { orderAPI } from "../../services/api";
import { useWorkflow } from "../../hooks/useWorkflow";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "../../components/workflow";
import PageHeader from "../../components/PageHeader";
import { getOrderLifecycleStatus, getInventoryImpact, getOrderLinks } from "../../utils/orderLifecycle";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    workflow,
    loading: workflowLoading,
    error: workflowError,
    approve,
    reject,
  } = useWorkflow("order", id);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await orderAPI.getOrderById(id);
        setOrder(response.order || response.data || response);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Handle approve
  const handleApprove = async (remarks) => {
    try {
      await approve(remarks);
      // Order will be refreshed via workflow hook
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Handle reject
  const handleReject = async (reason, remarks) => {
    try {
      await reject(reason, remarks);
      // Order will be refreshed via workflow hook
    } catch (err) {
      // Error already handled in hook
    }
  };

  if (loading || workflowLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Order not found"}</Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/orders/approvals")}
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={`Order ${order.orderNumber || order.id}`}
        subtitle="View order details and approval workflow"
      />

      <Button
        startIcon={<ArrowLeft />}
        onClick={() => navigate("/orders/approvals")}
        sx={{ mb: 3 }}
      >
        Back to Orders
      </Button>

      {workflowError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {workflowError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Order Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Order Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {order.orderNumber || order.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  {(() => {
                    const lifecycleStatus = getOrderLifecycleStatus(order);
                    return (
                      <Box>
                        <Chip
                          label={lifecycleStatus.label}
                          color={lifecycleStatus.color}
                          size="small"
                          icon={
                            lifecycleStatus.isBlocked ? (
                              <AlertCircle size={14} />
                            ) : lifecycleStatus.lifecycleStage === "approved" ? (
                              <CheckCircle size={14} />
                            ) : (
                              <Clock size={14} />
                            )
                          }
                        />
                        {lifecycleStatus.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                            {lifecycleStatus.description}
                          </Typography>
                        )}
                      </Box>
                    );
                  })()}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Dealer
                  </Typography>
                  <Typography variant="body1">
                    {order.dealer?.name || order.dealerName || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">{formatDate(order.createdAt)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                    {formatCurrency(order.totalAmount || order.amount)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Blocking Reason Alert - Backend Intelligence */}
          {(() => {
            const lifecycleStatus = getOrderLifecycleStatus(order);
            if (lifecycleStatus.isBlocked && lifecycleStatus.blockingReason) {
              return (
                <Alert severity="warning" sx={{ mb: 3 }} icon={<AlertCircle />}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Order Blocked
                  </Typography>
                  <Typography variant="body2">
                    {lifecycleStatus.blockingReason}
                  </Typography>
                </Alert>
              );
            }
            return null;
          })()}

          {/* Inventory Impact Preview - Backend Intelligence */}
          {(() => {
            const inventoryImpact = getInventoryImpact(order);
            if (inventoryImpact && inventoryImpact.items.length > 0) {
              return (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                      <Package size={20} />
                      Inventory Impact Preview
                    </Typography>
                    {inventoryImpact.hasLowStock && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        This order will result in low stock for some materials
                      </Alert>
                    )}
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Material</TableCell>
                            <TableCell align="right">Order Qty</TableCell>
                            <TableCell align="right">Available Stock</TableCell>
                            <TableCell align="right">After Order</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {inventoryImpact.items.map((item, index) => {
                            const afterOrder = item.availableStock !== null 
                              ? item.availableStock - item.quantity 
                              : null;
                            return (
                              <TableRow key={index}>
                                <TableCell>{item.materialName}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                                <TableCell align="right">
                                  {item.availableStock !== null ? item.availableStock : "N/A"}
                                </TableCell>
                                <TableCell align="right">
                                  {afterOrder !== null ? afterOrder : "N/A"}
                                </TableCell>
                                <TableCell align="center">
                                  {item.willBeLow ? (
                                    <Chip label="Low Stock" size="small" color="warning" />
                                  ) : afterOrder !== null && afterOrder < 0 ? (
                                    <Chip label="Insufficient" size="small" color="error" />
                                  ) : (
                                    <Chip label="OK" size="small" color="success" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Linked Invoices and Payments - Backend Intelligence */}
          {(() => {
            const links = getOrderLinks(order);
            if (links.hasLinked) {
              return (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Related Documents
                    </Typography>
                    <Grid container spacing={2}>
                      {links.invoices.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Receipt size={18} />
                            <Typography variant="subtitle2">Linked Invoices</Typography>
                          </Box>
                          {links.invoices.map((inv, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary">
                              • {inv.invoiceNumber || inv.id?.slice(0, 8)}
                            </Typography>
                          ))}
                        </Grid>
                      )}
                      {links.payments.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <CreditCard size={18} />
                            <Typography variant="subtitle2">Linked Payments</Typography>
                          </Box>
                          {links.payments.map((pay, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary">
                              • Payment #{pay.id?.slice(0, 8) || idx + 1}
                            </Typography>
                          ))}
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* Order Items */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Order Items
              </Typography>

              {order.items && order.items.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Material</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.material?.name || item.materialName || "N/A"}
                          </TableCell>
                          <TableCell>{item.quantity || 0}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice || item.price)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(
                              (item.quantity || 0) * (item.unitPrice || item.price || 0)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No items found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Section */}
        <Grid item xs={12} md={4}>
          {/* Workflow Progress Bar */}
          {workflow && <WorkflowProgressBar workflow={workflow} />}

          {/* Workflow Status */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <WorkflowStatus workflow={workflow} entityType="order" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="order"
                entityId={id}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={workflowLoading}
                error={workflowError}
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Workflow Timeline */}
      {workflow && workflow.timeline && (
        <Box sx={{ mt: 3 }}>
          <WorkflowTimeline timeline={workflow.timeline} workflow={workflow} />
        </Box>
      )}
    </Box>
  );
}

