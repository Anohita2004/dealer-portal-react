import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import { CheckCircle, XCircle } from "lucide-react";
import ApprovalWorkflow from "./ApprovalWorkflow";
import { orderAPI } from "../services/api";
import { toast } from "react-toastify";

/**
 * Order Approval Card Component
 * Based on FRONTEND_INTEGRATION_GUIDE.md
 */
export default function OrderApprovalCard({ order, onUpdate }) {
  const handleApprove = async () => {
    try {
      await orderAPI.approveOrder(order.id, { action: "approve" });
      toast.success("Order approved successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to approve order:", error);
      toast.error(error.response?.data?.error || "Failed to approve order");
    }
  };

  const handleReject = async (rejectionReason) => {
    if (!rejectionReason) return;

    try {
      await orderAPI.rejectOrder(order.id, { action: "reject", reason: rejectionReason, remarks: rejectionReason });
      toast.success("Order rejected");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to reject order:", error);
      toast.error(error.response?.data?.error || "Failed to reject order");
    }
  };

  return (
    <Card sx={{ mb: 2, "&:hover": { boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
          <Box>
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
          <Box>
            <Chip
              label={order.approvalStatus?.toUpperCase() || order.status?.toUpperCase() || "PENDING"}
              color={
                order.approvalStatus === "approved" || order.status === "approved"
                  ? "success"
                  : order.approvalStatus === "rejected" || order.status === "rejected"
                  ? "error"
                  : "warning"
              }
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Stage: {order.approvalStage || order.currentStage || "N/A"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <ApprovalWorkflow
          entity={{ type: "order", ...order }}
          currentStage={order.approvalStage || order.currentStage}
          approvalStatus={order.approvalStatus || order.status}
          onApprove={handleApprove}
          onReject={handleReject}
          approvalHistory={order.approvalHistory || order.history || []}
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

