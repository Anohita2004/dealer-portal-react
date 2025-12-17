import React, { useState, useEffect } from "react";
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
  Alert,
} from "@mui/material";
import { CheckCircle, XCircle, Download, FileText, Eye, Clock, AlertCircle } from "lucide-react";
import { paymentAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "./workflow";
import { getPaymentPendingReason, getPaymentStatusDisplay } from "../utils/paymentStatus";
import { isAccountsUser } from "../utils/accountsPermissions";
import { useAuth } from "../context/AuthContext";

/**
 * Payment Approval Card Component
 * Enhanced to display backend workflow intelligence: stages, SLA, next approver, timeline
 */
export default function PaymentApprovalCard({ payment, onUpdate, userRole }) {
  const { user } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [workflow, setWorkflow] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  
  // Use user from context if userRole prop not provided
  const effectiveUserRole = userRole || user?.role;

  // Fetch workflow data to get SLA and stage information
  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!payment?.id) return;
      setWorkflowLoading(true);
      try {
        const response = await paymentAPI.getWorkflowStatus(payment.id);
        const workflowData = response.workflow || response.data || response;
        setWorkflow(workflowData);
      } catch (err) {
        // Silently fail - workflow data is optional for list view
        console.debug("Could not fetch workflow for payment:", payment.id);
      } finally {
        setWorkflowLoading(false);
      }
    };
    fetchWorkflow();
  }, [payment?.id]);

  const handleApprove = async (remarks) => {
    try {
      if (userRole === "dealer_admin") {
        await paymentAPI.approveByDealer(payment.id, { action: "approve", remarks });
      } else {
        await paymentAPI.approveByFinance(payment.id, { action: "approve", remarks });
      }
      toast.success("Payment approved successfully");
      if (onUpdate) onUpdate();
      // Refresh workflow data
      const response = await paymentAPI.getWorkflowStatus(payment.id);
      const workflowData = response.workflow || response.data || response;
      setWorkflow(workflowData);
    } catch (error) {
      console.error("Failed to approve payment:", error);
      toast.error(error.response?.data?.error || "Failed to approve payment");
    }
  };

  const handleReject = async (reason, remarks) => {
    if (!reason) return;

    try {
      if (userRole === "dealer_admin") {
        await paymentAPI.rejectByDealer(payment.id, { action: "reject", reason, remarks });
      } else {
        await paymentAPI.rejectByFinance(payment.id, { action: "reject", reason, remarks });
      }
      toast.success("Payment rejected");
      if (onUpdate) onUpdate();
      // Refresh workflow data
      const response = await paymentAPI.getWorkflowStatus(payment.id);
      const workflowData = response.workflow || response.data || response;
      setWorkflow(workflowData);
    } catch (error) {
      console.error("Failed to reject payment:", error);
      toast.error(error.response?.data?.error || "Failed to reject payment");
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
  
  // Get current stage from workflow (backend authority) or fallback to payment data
  const currentStage = workflow?.currentStage || payment.approvalStage || payment.currentStage;
  
  // Format stage name for display
  const formatStageName = (stage) => {
    if (!stage) return "N/A";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
              {(() => {
                const statusDisplay = getPaymentStatusDisplay(payment, workflow);
                return (
                  <Chip
                    label={statusDisplay.label}
                    color={statusDisplay.color}
                    size="small"
                    icon={
                      statusDisplay.icon === "success" ? (
                        <CheckCircle size={14} />
                      ) : statusDisplay.icon === "error" ? (
                        <XCircle size={14} />
                      ) : (
                        <Clock size={14} />
                      )
                    }
                  />
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

          {/* Why Payment is Pending - Backend Intelligence */}
          {(() => {
            const pendingReason = getPaymentPendingReason(payment, workflow);
            if (pendingReason) {
              return (
                <Alert 
                  severity={pendingReason.blockingType === "missing_proof" || pendingReason.blockingType === "finance_discrepancy" || pendingReason.blockingType === "reconciliation_discrepancy" ? "warning" : "info"} 
                  sx={{ mb: 2 }}
                  icon={<AlertCircle />}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {pendingReason.reason}
                  </Typography>
                  <Typography variant="body2">
                    {pendingReason.nextAction}
                  </Typography>
                  {pendingReason.details && (
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                      {pendingReason.details}
                    </Typography>
                  )}
                  {/* Accounts User Context */}
                  {isAccountsUser(user) && workflow?.currentStage === "finance_approval" && (
                    <Typography variant="caption" sx={{ display: "block", mt: 1, fontStyle: "italic" }}>
                      This payment is at the finance approval stage. As an Accounts user, you verify amounts, proof documents, and UTR numbers before approval.
                    </Typography>
                  )}
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
                  SLA Overdue: This payment has exceeded its approval deadline by {slaUrgency.diffHours}h {slaUrgency.diffMinutes}m
                </Typography>
              </Box>
            </Alert>
          )}

          {/* Finance Remarks - Backend Intelligence */}
          {payment.financeRemarks && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Finance Remarks:
              </Typography>
              <Typography variant="body2">
                {payment.financeRemarks}
              </Typography>
            </Alert>
          )}

          {/* Reconciliation State - Backend Intelligence */}
          {payment.reconciliationStatus && (
            <Alert 
              severity={
                payment.reconciliationStatus === "reconciled" 
                  ? "success" 
                  : payment.reconciliationStatus === "discrepancy" 
                  ? "error" 
                  : "warning"
              } 
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Reconciliation Status: {payment.reconciliationStatus.charAt(0).toUpperCase() + payment.reconciliationStatus.slice(1)}
              </Typography>
              {payment.reconciliationNotes && (
                <Typography variant="body2">
                  {payment.reconciliationNotes}
                </Typography>
              )}
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Workflow Progress Bar */}
          {workflow && <WorkflowProgressBar workflow={workflow} />}

          {/* Workflow Status */}
          {workflow && (
            <Box sx={{ mt: 2 }}>
              <WorkflowStatus workflow={workflow} entityType="payment" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 2 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="payment"
                entityId={payment.id}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={workflowLoading}
              />
            </Box>
          )}

          {/* Workflow Timeline */}
          {workflow && workflow.timeline && (
            <Box sx={{ mt: 2 }}>
              <WorkflowTimeline timeline={workflow.timeline} workflow={workflow} />
            </Box>
          )}

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

