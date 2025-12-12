import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
} from "@mui/material";
import { CheckCircle, XCircle, Download, FileText } from "lucide-react";
import ApprovalWorkflow from "./ApprovalWorkflow";
import { invoiceAPI } from "../services/api";
import { toast } from "react-toastify";

/**
 * Invoice Approval Card Component
 * Displays invoice details with approval workflow
 */
export default function InvoiceApprovalCard({ invoice, onUpdate }) {
  const handleApprove = async () => {
    try {
      await invoiceAPI.approveInvoice(invoice.id, { action: "approve" });
      toast.success("Invoice approved successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to approve invoice:", error);
      toast.error(error.response?.data?.error || "Failed to approve invoice");
    }
  };

  const handleReject = async (rejectionReason) => {
    if (!rejectionReason) return;

    try {
      await invoiceAPI.approveInvoice(invoice.id, { action: "reject", reason: rejectionReason, remarks: rejectionReason });
      toast.success("Invoice rejected");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to reject invoice:", error);
      toast.error(error.response?.data?.error || "Failed to reject invoice");
    }
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
    <Card sx={{ mb: 2, "&:hover": { boxShadow: 4 } }}>
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
            <Chip
              label={invoice.approvalStatus?.toUpperCase() || invoice.status?.toUpperCase() || "PENDING"}
              color={
                invoice.approvalStatus === "approved" || invoice.status === "approved"
                  ? "success"
                  : invoice.approvalStatus === "rejected" || invoice.status === "rejected"
                  ? "error"
                  : "warning"
              }
            />
            <Typography variant="caption" display="block" color="text.secondary">
              Stage: {invoice.approvalStage || invoice.currentStage || "N/A"}
            </Typography>
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

        <Divider sx={{ my: 2 }} />

        <ApprovalWorkflow
          entity={{ type: "invoice", ...invoice }}
          currentStage={invoice.approvalStage || invoice.currentStage}
          approvalStatus={invoice.approvalStatus || invoice.status}
          onApprove={handleApprove}
          onReject={handleReject}
          approvalHistory={invoice.approvalHistory || invoice.history || []}
          showHistory={true}
        />

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
  );
}

