import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowLeft, Download, Printer, FileText } from "lucide-react";
import { invoiceAPI } from "../services/api";
import { useWorkflow } from "../hooks/useWorkflow";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "../components/workflow";
import PageHeader from "../components/PageHeader";
import InvoiceTemplate from "../components/InvoiceTemplate";
import { Tabs, Tab } from "@mui/material";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("details"); // "details" or "invoice"

  const {
    workflow,
    loading: workflowLoading,
    error: workflowError,
    approve,
    reject,
  } = useWorkflow("invoice", id);

  // Fetch invoice details
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await invoiceAPI.getInvoiceById(id);
        setInvoice(response.invoice || response.data || response);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  // Handle approve
  const handleApprove = async (remarks) => {
    try {
      await approve(remarks);
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Handle reject
  const handleReject = async (reason, remarks) => {
    try {
      await reject(reason, remarks);
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    try {
      const blob = await invoiceAPI.downloadInvoicePDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF");
    }
  };

  if (loading || workflowLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Invoice not found"}</Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/invoices")}
          sx={{ mt: 2 }}
        >
          Back to Invoices
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
        title={`Invoice ${invoice.invoiceNumber || invoice.id}`}
        subtitle="View invoice details and approval workflow"
      />

      <Box sx={{ display: "flex", gap: 2, mb: 3, justifyContent: "space-between", alignItems: "center" }} className="no-print">
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/invoices")}
        >
          Back to Invoices
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          {viewMode === "invoice" && (
            <Button
              variant="outlined"
              startIcon={<Printer />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          )}
        </Box>
      </Box>

      {/* View Mode Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }} className="no-print">
        <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
          <Tab icon={<FileText size={18} />} iconPosition="start" label="Invoice View" value="invoice" />
          <Tab label="Details & Workflow" value="details" />
        </Tabs>
      </Box>

      {/* Invoice Template View */}
      {viewMode === "invoice" && (
        <Box
          sx={{
            background: "var(--color-background)",
            padding: "var(--spacing-6)",
            "@media print": {
              padding: 0,
              background: "white",
            },
          }}
        >
          <InvoiceTemplate
            invoice={invoice}
            dealer={invoice.dealer}
            company={{
              bankName: invoice.companyBankName || "Rimberio",
              accountNumber: invoice.companyAccountNumber || "0123 4567 8901",
              signatoryName: invoice.signatoryName || "Claudia",
              signatoryTitle: invoice.signatoryTitle || "Finance Manager",
            }}
          />
        </Box>
      )}

      {/* Details & Workflow View */}
      {viewMode === "details" && (
        <>

      {workflowError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {workflowError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Invoice Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Invoice Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {invoice.invoiceNumber || invoice.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={invoice.status?.toUpperCase() || "PENDING"}
                    color={
                      invoice.status === "approved"
                        ? "success"
                        : invoice.status === "rejected"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Dealer
                  </Typography>
                  <Typography variant="body1">
                    {invoice.dealer?.name || invoice.dealerName || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="body1">
                    {invoice.orderNumber || invoice.order?.orderNumber || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Date
                  </Typography>
                  <Typography variant="body1">{formatDate(invoice.invoiceDate || invoice.createdAt)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1">{formatDate(invoice.dueDate)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                    {formatCurrency(invoice.totalAmount || invoice.amount)}
                  </Typography>
                </Grid>

                {invoice.paidAmount && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Paid Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "success.main" }}>
                      {formatCurrency(invoice.paidAmount)}
                    </Typography>
                  </Grid>
                )}

                {invoice.outstandingAmount && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Outstanding Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "error.main" }}>
                      {formatCurrency(invoice.outstandingAmount)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Payment History
                </Typography>
                {/* Payment history table can be added here */}
                <Typography variant="body2" color="text.secondary">
                  {invoice.payments.length} payment(s) recorded
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Workflow Section */}
        <Grid item xs={12} md={4}>
          {/* Workflow Progress Bar */}
          {workflow && <WorkflowProgressBar workflow={workflow} />}

          {/* Workflow Status */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <WorkflowStatus workflow={workflow} entityType="invoice" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="invoice"
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
        </>
      )}
    </Box>
  );
}

