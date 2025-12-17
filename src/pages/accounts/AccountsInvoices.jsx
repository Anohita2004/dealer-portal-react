import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Alert, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from "@mui/material";
import { Eye, FileText, Download, Lock, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import api, { invoiceAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { isAccountsUser, getDisabledActionExplanation } from "../../utils/accountsPermissions";
import { useWorkflow } from "../../hooks/useWorkflow";
import { WorkflowTimeline } from "../../components/workflow";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function AccountsInvoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/accounts/invoices");
      setInvoices(res.data.invoices || res.data || []);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setDetailOpen(true);
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const response = await invoiceAPI.downloadInvoicePDF(invoice.id);
      const url = window.URL.createObjectURL(new Blob([response]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      a.click();
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Failed to download PDF");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Invoices"
        subtitle="View all invoices in read-only mode. Invoices are system-generated and cannot be modified."
      />

      {/* Read-Only Notice */}
      {isAccountsUser(user) && (
        <Alert severity="info" icon={<Lock size={20} />} sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Read-Only Access
          </Typography>
          <Typography variant="body2">
            {getDisabledActionExplanation(user, "edit_invoices")}
          </Typography>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent>
            <Typography align="center" sx={{ py: 4 }}>Loading invoices...</Typography>
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No invoices found
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Invoice #</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Dealer</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Total (₹)</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Paid (₹)</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Outstanding (₹)</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const outstanding = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
                    return (
                      <tr key={invoice.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px" }}>
                          {invoice.invoiceNumber || `#${invoice.id?.slice(0, 8)}`}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {invoice.dealer?.businessName || invoice.dealerName || "N/A"}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                          ₹{Number(invoice.totalAmount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#16a34a" }}>
                          ₹{Number(invoice.paidAmount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: outstanding > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                          ₹{outstanding.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <Chip
                            label={invoice.status?.toUpperCase() || "PENDING"}
                            color={
                              invoice.status === "approved" || invoice.status === "paid"
                                ? "success"
                                : invoice.status === "rejected"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                          />
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Eye size={16} />}
                              onClick={() => handleViewDetail(invoice)}
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Download size={16} />}
                              onClick={() => handleDownloadPDF(invoice)}
                            >
                              PDF
                            </Button>
                          </Box>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Dialog with Audit Trail */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FileText size={20} />
            Invoice Details
            {selectedInvoice && (
              <Chip
                label={selectedInvoice.invoiceNumber || `#${selectedInvoice.id?.slice(0, 8)}`}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && <InvoiceDetailView invoice={selectedInvoice} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function InvoiceDetailView({ invoice }) {
  const { workflow } = useWorkflow("invoice", invoice.id);
  const outstanding = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

  return (
    <Box>
      {/* Financial Summary */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Financial Summary
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Amount</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ₹{Number(invoice.totalAmount || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "success.main" }}>
                ₹{Number(invoice.paidAmount || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Outstanding</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: outstanding > 0 ? "error.main" : "success.main" }}>
                ₹{outstanding.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip
                label={invoice.status?.toUpperCase() || "PENDING"}
                color={
                  invoice.status === "approved" || invoice.status === "paid"
                    ? "success"
                    : invoice.status === "rejected"
                    ? "error"
                    : "warning"
                }
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Invoice Details
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Invoice Number</Typography>
              <Typography variant="body1">{invoice.invoiceNumber || `#${invoice.id?.slice(0, 8)}`}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="body1">
                {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Dealer</Typography>
              <Typography variant="body1">
                {invoice.dealer?.businessName || invoice.dealerName || "N/A"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Order</Typography>
              <Typography variant="body1">
                {invoice.order?.orderNumber || invoice.orderId || "N/A"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Related Payments for Reconciliation Context */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Related Payments (for Reconciliation)
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {invoice.payments.map((payment) => (
                <Box
                  key={payment.id}
                  sx={{
                    p: 1.5,
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Payment #{payment.id?.slice(0, 8)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {payment.paymentMode || "N/A"} • {payment.utrNumber ? `UTR: ${payment.utrNumber}` : "No UTR"}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ₹{Number(payment.amount || 0).toLocaleString()}
                    </Typography>
                    <Chip
                      label={payment.status || payment.approvalStatus || "Pending"}
                      size="small"
                      color={
                        payment.status === "approved" || payment.approvalStatus === "approved"
                          ? "success"
                          : payment.status === "rejected" || payment.approvalStatus === "rejected"
                          ? "error"
                          : "warning"
                      }
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Workflow Timeline / Audit Trail */}
      {workflow && workflow.timeline && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Audit Trail
            </Typography>
            <WorkflowTimeline timeline={workflow.timeline} workflow={workflow} />
          </CardContent>
        </Card>
      )}

      {/* Read-Only Notice */}
      <Alert severity="info" icon={<Lock size={20} />} sx={{ mt: 2 }}>
        <Typography variant="body2">
          This invoice is read-only. Invoices are system-generated from orders and cannot be modified.
        </Typography>
      </Alert>
    </Box>
  );
}
