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
  Checkbox,
  alpha,
  IconButton,
} from "@mui/material";
import { CheckCircle, XCircle, Download, FileText, Clock, AlertCircle, CreditCard } from "lucide-react";
import { invoiceAPI } from "../services/api";
import { toast } from "react-toastify";
import { getInvoiceStatusLabel, getInvoiceStatusColor, isPaidViaIntegration } from "../utils/invoiceStatus";
import { useWorkflow } from "../hooks/useWorkflow";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "./workflow";

/**
 * Invoice Approval Card Component
 * Enhanced to display backend workflow intelligence: stages, SLA, next approver, timeline
 */
export default function InvoiceApprovalCard({ invoice, onUpdate, selectable, selected, onSelect }) {
  const [workflow, setWorkflow] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Fetch workflow data to get SLA and stage information
  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!invoice?.id) return;
      setWorkflowLoading(true);
      try {
        const response = await invoiceAPI.getWorkflowStatus(invoice.id);
        const workflowData = response.workflow || response.data || response;
        setWorkflow(workflowData);
      } catch (err) {
        // Silently fail - workflow data is optional for list view
        console.debug("Could not fetch workflow for invoice:", invoice.id);
      } finally {
        setWorkflowLoading(false);
      }
    };
    fetchWorkflow();
  }, [invoice?.id]);
  const handleApprove = async (remarks) => {
    try {
      await invoiceAPI.approveInvoice(invoice.id, { action: "approve", remarks });
      toast.success("Invoice approved successfully");
      if (onUpdate) onUpdate();
      // Refresh workflow data
      const response = await invoiceAPI.getWorkflowStatus(invoice.id);
      const workflowData = response.workflow || response.data || response;
      setWorkflow(workflowData);
    } catch (error) {
      console.error("Failed to approve invoice:", error);
      toast.error(error.response?.data?.error || "Failed to approve invoice");
    }
  };

  const handleReject = async (reason, remarks) => {
    if (!reason) return;

    try {
      await invoiceAPI.approveInvoice(invoice.id, { action: "reject", reason, remarks });
      toast.success("Invoice rejected");
      if (onUpdate) onUpdate();
      // Refresh workflow data
      const response = await invoiceAPI.getWorkflowStatus(invoice.id);
      const workflowData = response.workflow || response.data || response;
      setWorkflow(workflowData);
    } catch (error) {
      console.error("Failed to reject invoice:", error);
      toast.error(error.response?.data?.error || "Failed to reject invoice");
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

  // Get current stage from workflow (backend authority) or fallback to invoice data
  const currentStage = workflow?.currentStage || invoice.approvalStage || invoice.currentStage;

  // Format stage name for display
  const formatStageName = (stage) => {
    if (!stage) return "N/A";
    return stage
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const downloadPdf = async () => {
    try {
      const response = await invoiceAPI.downloadInvoicePDF(invoice.id);
      const url = window.URL.createObjectURL(new Blob([response]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
      {selectable && (
        <Box sx={{ pt: 2, pl: 1 }}>
          <Checkbox
            checked={selected}
            onChange={() => onSelect(invoice.id)}
            sx={{
              '&.Mui-checked': {
                color: 'primary.main',
              },
            }}
          />
        </Box>
      )}
      <Card
        sx={{
          mb: 2,
          flexGrow: 1,
          transition: 'all 0.2s',
          border: selected ? '1px solid' : '1px solid transparent',
          borderColor: 'primary.main',
          backgroundColor: selected ? (theme) => alpha(theme.palette.primary.main, 0.02) : 'inherit',
          "&:hover": {
            boxShadow: 4,
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.3)
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FileText size={20} />
                {invoice.invoiceNumber || `Invoice #${invoice.id}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dealer: {invoice.dealer?.businessName || invoice.dealerName || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order: {invoice.order?.orderNumber || invoice.orderId || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: ₹{Number(invoice.totalAmount || invoice.baseAmount || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}
              </Typography>
              {invoice.dueDate && (
                <Typography variant="body2" color="text.secondary">
                  Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                <Chip
                  label={getInvoiceStatusLabel(invoice)}
                  color={getInvoiceStatusColor(getInvoiceStatusLabel(invoice))}
                  size="small"
                />
                {isPaidViaIntegration(invoice) && (
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontWeight: 600 }}>
                    <CreditCard size={12} /> Online
                  </Typography>
                )}
              </Box>
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
              <IconButton
                size="small"
                onClick={downloadPdf}
                color="primary"
                title="Download PDF"
              >
                <Download size={18} />
              </IconButton>
            </Box>
          </Box>

          {/* SLA Urgency Alert - Visual prominence for overdue items */}
          {slaUrgency && slaUrgency.isOverdue && workflow?.approvalStatus === "pending" && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AlertCircle size={20} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  SLA Overdue: This invoice has exceeded its approval deadline by {slaUrgency.diffHours}h {slaUrgency.diffMinutes}m
                </Typography>
              </Box>
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Workflow Progress Bar */}
          {workflow && <WorkflowProgressBar workflow={workflow} />}

          {/* Workflow Status */}
          {workflow && (
            <Box sx={{ mt: 2 }}>
              <WorkflowStatus workflow={workflow} entityType="invoice" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 2 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="invoice"
                entityId={invoice.id}
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

          {invoice.description && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Description:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.description}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

