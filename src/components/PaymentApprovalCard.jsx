import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { CheckCircle, XCircle, Download, FileText, Eye } from "lucide-react";
import ApprovalWorkflow from "./ApprovalWorkflow";
import { paymentAPI } from "../services/api";
import { toast } from "react-toastify";

/**
 * Payment Approval Card Component
 * Displays payment request details with approval workflow
 */
export default function PaymentApprovalCard({ payment, onUpdate, userRole }) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleApprove = async () => {
    try {
      if (userRole === "dealer_admin") {
        await paymentAPI.approveByDealer(payment.id, { action: "approve" });
      } else {
        await paymentAPI.approveByFinance(payment.id, { action: "approve" });
      }
      toast.success("Payment approved successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to approve payment:", error);
      toast.error(error.response?.data?.error || "Failed to approve payment");
    }
  };

  const handleReject = async (rejectionReason) => {
    if (!rejectionReason) return;

    try {
      if (userRole === "dealer_admin") {
        await paymentAPI.rejectByDealer(payment.id, { action: "reject", reason: rejectionReason, remarks: rejectionReason });
      } else {
        await paymentAPI.rejectByFinance(payment.id, { action: "reject", reason: rejectionReason, remarks: rejectionReason });
      }
      toast.success("Payment rejected");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to reject payment:", error);
      toast.error(error.response?.data?.error || "Failed to reject payment");
    }
  };

  const downloadProof = async () => {
    try {
      // Assuming backend provides download endpoint
      const response = await fetch(`/api/payments/${payment.id}/proof`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-proof-${payment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Proof downloaded");
    } catch (error) {
      console.error("Failed to download proof:", error);
      toast.error("Failed to download proof");
    }
  };

  const getPaymentModeColor = (mode) => {
    const colors = {
      NEFT: "primary",
      RTGS: "success",
      CHEQUE: "warning",
      CASH: "default",
    };
    return colors[mode] || "default";
  };

  return (
    <>
      <Card sx={{ mb: 2, "&:hover": { boxShadow: 4 } }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FileText size={20} />
                Payment Request #{payment.id?.slice(0, 8) || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invoice: {payment.invoice?.invoiceNumber || payment.invoiceId || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dealer: {payment.dealer?.businessName || payment.dealerName || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: ₹{Number(payment.amount || 0).toLocaleString()}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Chip
                  label={payment.paymentMode || "N/A"}
                  color={getPaymentModeColor(payment.paymentMode)}
                  size="small"
                />
                {payment.utrNumber && (
                  <Chip
                    label={`UTR: ${payment.utrNumber}`}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Date: {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "N/A"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
              <Chip
                label={payment.approvalStatus?.toUpperCase() || payment.status?.toUpperCase() || "PENDING"}
                color={
                  payment.approvalStatus === "approved" || payment.status === "approved"
                    ? "success"
                    : payment.approvalStatus === "rejected" || payment.status === "rejected"
                    ? "error"
                    : "warning"
                }
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Stage: {payment.approvalStage || payment.currentStage || "N/A"}
              </Typography>
              {payment.proofFile && (
                <Button
                  size="small"
                  startIcon={<Eye size={16} />}
                  onClick={() => setPreviewOpen(true)}
                >
                  View Proof
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <ApprovalWorkflow
            entity={{ type: "payment", ...payment }}
            currentStage={payment.approvalStage || payment.currentStage}
            approvalStatus={payment.approvalStatus || payment.status}
            onApprove={handleApprove}
            onReject={handleReject}
            approvalHistory={payment.approvalHistory || payment.history || []}
            showHistory={true}
          />

          {payment.remarks && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Remarks:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {payment.remarks}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Proof Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Payment Proof - {payment.id?.slice(0, 8)}
        </DialogTitle>
        <DialogContent>
          {payment.proofFile && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              {payment.proofFile.includes("image") ? (
                <img
                  src={payment.proofFile}
                  alt="Payment proof"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              ) : (
                <Box>
                  <FileText size={48} style={{ marginBottom: 16 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Proof file available
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Download size={18} />}
                    onClick={downloadProof}
                  >
                    Download Proof
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

