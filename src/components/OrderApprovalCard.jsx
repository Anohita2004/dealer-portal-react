import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Alert,
  Tooltip,
} from "@mui/material";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import ApprovalWorkflow from "./ApprovalWorkflow";
import { orderAPI, workflowAPI } from "../services/api";
import { toast } from "react-toastify";
import { useWorkflow } from "../hooks/useWorkflow";
import { getOrderLifecycleStatus, getApprovalProgress } from "../utils/orderLifecycle";

/**
 * Order Approval Card Component
 * Enhanced to display backend workflow intelligence: stages, SLA urgency, and permissions
 */
export default function OrderApprovalCard({ order, onUpdate }) {
  const [workflow, setWorkflow] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Fetch workflow data to get SLA and stage information
  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!order?.id) return;
      setWorkflowLoading(true);
      try {
        const response = await orderAPI.getWorkflowStatus(order.id);
        const workflowData = response.workflow || response.data || response;
        setWorkflow(workflowData);
        console.log("Workflow data fetched for order:", order.id, workflowData);
      } catch (err) {
        // Log error for debugging
        console.error("Could not fetch workflow for order:", order.id, err.response?.data || err.message);
        // Still set workflow to null so component can work with order data
        setWorkflow(null);
      } finally {
        setWorkflowLoading(false);
      }
    };
    fetchWorkflow();
  }, [order?.id]);

  const handleApprove = async (remarks, stage) => {
    try {
      // Get current stage from workflow, order data, or passed parameter
      let currentStage = stage || workflow?.currentStage || order.approvalStage || order.currentStage;
      
      // If stage is empty/null, determine it from the workflow stages
      // For dealer_admin at initial stage, set it to dealer_admin
      if (!currentStage || currentStage === "") {
        const stages = ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager"];
        currentStage = stages[0]; // Set to first stage (dealer_admin)
      }
      
      // Try using the unified workflow API first, which might handle null stages better
      // If that fails, fall back to the order-specific API with stage information
      try {
        await workflowAPI.approveEntity("order", order.id, remarks || "");
        toast.success("Order approved successfully");
      } catch (workflowError) {
        // If workflow API fails, try order API with stage information
        const payload = { 
          action: "approve",
          ...(remarks && { remarks }),
          ...(currentStage && { stage: currentStage })
        };
        await orderAPI.approveOrder(order.id, payload);
        toast.success("Order approved successfully");
      }
      
      if (onUpdate) onUpdate();
      // Refresh workflow data
      const response = await orderAPI.getWorkflowStatus(order.id);
      const workflowData = response.workflow || response.data || response;
      setWorkflow(workflowData);
    } catch (error) {
      console.error("Failed to approve order:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || "Failed to approve order";
      toast.error(errorMessage);
    }
  };

  const handleReject = async (rejectionReason) => {
    if (!rejectionReason) return;

    try {
      await orderAPI.rejectOrder(order.id, { action: "reject", reason: rejectionReason, remarks: rejectionReason });
      toast.success("Order rejected");
      if (onUpdate) onUpdate();
      // Refresh workflow data
      const response = await orderAPI.getWorkflowStatus(order.id);
      const workflowData = response.workflow || response.data || response;
      setWorkflow(workflowData);
    } catch (error) {
      console.error("Failed to reject order:", error);
      toast.error(error.response?.data?.error || "Failed to reject order");
    }
  };

  // Calculate SLA urgency from backend data
  const getSLAUrgency = () => {
    if (!workflow?.currentSlaExpiresAt) return null;

    const expiresAt = new Date(workflow.currentSlaExpiresAt);
    const now = new Date();
    const diffMs = expiresAt - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const isOverdue = diffMs < 0;
    const isDueSoon = diffMs > 0 && diffMs < 24 * 60 * 60 * 1000; // Less than 24 hours

    return {
      isOverdue,
      isDueSoon,
      diffHours: Math.abs(diffHours),
      diffMinutes: Math.abs(diffMinutes),
      expiresAt,
    };
  };

  const slaUrgency = getSLAUrgency();
  
  // Get current stage from workflow (backend authority) or fallback to order data
  const currentStage = workflow?.currentStage || order.approvalStage || order.currentStage;
  
  // Format stage name for display
  const formatStageName = (stage) => {
    if (!stage) return "N/A";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card sx={{ mb: 2, "&:hover": { boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {order.orderNumber || `Order #${order.id}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dealer: {order.dealer?.businessName || order.dealerName || "N/A"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Amount: ₹{Number(order.totalAmount || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
            {(() => {
              const lifecycleStatus = getOrderLifecycleStatus(order);
              return (
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
              );
            })()}
            {currentStage && (
              <Chip
                label={`Stage: ${formatStageName(currentStage)}`}
                variant="outlined"
                size="small"
                color="primary"
              />
            )}
            {/* Approval Progress */}
            {workflow && (() => {
              const progress = getApprovalProgress(workflow);
              if (progress > 0 && progress < 100) {
                return (
                  <Box sx={{ width: "100%", mt: 0.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Approval Progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progress}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: "100%",
                        height: 4,
                        bgcolor: "grey.200",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${progress}%`,
                          height: "100%",
                          bgcolor: "primary.main",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                  </Box>
                );
              }
              return null;
            })()}
            {/* SLA Urgency Badge - Backend Intelligence */}
            {slaUrgency && workflow?.approvalStatus === "pending" && (
              <Chip
                icon={slaUrgency.isOverdue ? <AlertCircle size={16} /> : <Clock size={16} />}
                label={
                  slaUrgency.isOverdue
                    ? `Overdue: ${slaUrgency.diffHours}h ${slaUrgency.diffMinutes}m`
                    : slaUrgency.isDueSoon
                    ? `Due in: ${slaUrgency.diffHours}h ${slaUrgency.diffMinutes}m`
                    : `SLA: ${slaUrgency.diffHours}h ${slaUrgency.diffMinutes}m`
                }
                color={slaUrgency.isOverdue ? "error" : slaUrgency.isDueSoon ? "warning" : "info"}
                size="small"
                sx={{ fontWeight: slaUrgency.isOverdue || slaUrgency.isDueSoon ? 600 : 400 }}
              />
            )}
          </Box>
        </Box>

        {/* Order Approved Banner - Final Stage */}
        {(() => {
          const lifecycleStatus = getOrderLifecycleStatus(order);
          const isFullyApproved = 
            (workflow?.approvalStatus === "approved" || order.approvalStatus === "approved" || order.status === "approved") &&
            (lifecycleStatus.lifecycleStage === "approved" || !lifecycleStatus.isBlocked);
          
          if (isFullyApproved) {
            return (
              <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle size={24} />}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Order Approved
                </Typography>
                <Typography variant="body2">
                  This order has been fully approved through all stages and is ready for processing.
                </Typography>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Blocking Reason Alert - Backend Intelligence */}
        {(() => {
          const lifecycleStatus = getOrderLifecycleStatus(order);
          if (lifecycleStatus.isBlocked && lifecycleStatus.blockingReason) {
            return (
              <Alert severity="warning" sx={{ mb: 2 }} icon={<AlertCircle />}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Order Blocked: {lifecycleStatus.blockingReason}
                </Typography>
              </Alert>
            );
          }
          return null;
        })()}

        {/* SLA Urgency Alert - Visual prominence for overdue items */}
        {slaUrgency && slaUrgency.isOverdue && workflow?.approvalStatus === "pending" && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AlertCircle size={20} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                SLA Overdue: This order has exceeded its approval deadline by {slaUrgency.diffHours}h {slaUrgency.diffMinutes}m
              </Typography>
            </Box>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <ApprovalWorkflow
          entity={{ type: "order", ...order }}
          currentStage={workflow?.currentStage || order.approvalStage || order.currentStage}
          approvalStatus={workflow?.approvalStatus || order.approvalStatus || order.status}
          onApprove={(remarks, stage) => handleApprove(remarks, stage)}
          onReject={handleReject}
          approvalHistory={workflow?.timeline || order.approvalHistory || order.history || []}
          showHistory={true}
        />

        {order.items && order.items.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Order Items:
            </Typography>
            {order.items.map((item, idx) => (
              <Typography key={idx} variant="body2" color="text.secondary">
                • {item.materialName || item.name} - Qty: {item.quantity} - ₹
                {Number(item.amount || 0).toLocaleString()}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

