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
import { ArrowLeft, Download } from "lucide-react";
import { paymentAPI } from "../../services/api";
import { useWorkflow } from "../../hooks/useWorkflow";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "../../components/workflow";
import PageHeader from "../../components/PageHeader";

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    workflow,
    loading: workflowLoading,
    error: workflowError,
    approve,
    reject,
  } = useWorkflow("payment", id);

  // Fetch payment details
  useEffect(() => {
    const fetchPayment = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await paymentAPI.getPaymentById(id);
        setPayment(response.payment || response.data || response);
      } catch (err) {
        console.error("Error fetching payment:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch payment");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
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

  // Handle proof file download
  const handleDownloadProof = async () => {
    try {
      // Assuming there's a download endpoint for payment proof
      const response = await paymentAPI.getPaymentById(id);
      if (response.payment?.proofFile || response.proofFile) {
        const fileUrl = response.payment?.proofFile || response.proofFile;
        window.open(fileUrl, "_blank");
      } else {
        alert("Proof file not available");
      }
    } catch (err) {
      console.error("Error downloading proof:", err);
      alert("Failed to download proof file");
    }
  };

  if (loading || workflowLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !payment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Payment not found"}</Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/payments/finance/pending")}
          sx={{ mt: 2 }}
        >
          Back to Payments
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
        title={`Payment Request ${payment.paymentNumber || payment.id}`}
        subtitle="View payment request details and approval workflow"
      />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/payments/finance/pending")}
        >
          Back to Payments
        </Button>
        {payment.proofFile && (
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadProof}
          >
            Download Proof
          </Button>
        )}
      </Box>

      {workflowError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {workflowError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Payment Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Payment Request Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {payment.paymentNumber || payment.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={payment.status?.toUpperCase() || "PENDING"}
                    color={
                      payment.status === "approved"
                        ? "success"
                        : payment.status === "rejected"
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
                    {payment.dealer?.name || payment.dealerName || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1">
                    {payment.invoiceNumber || payment.invoice?.invoiceNumber || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Request Date
                  </Typography>
                  <Typography variant="body1">{formatDate(payment.requestDate || payment.createdAt)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Amount
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                    {formatCurrency(payment.amount || payment.paymentAmount)}
                  </Typography>
                </Grid>

                {payment.paymentMethod && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Method
                    </Typography>
                    <Typography variant="body1">{payment.paymentMethod}</Typography>
                  </Grid>
                )}

                {payment.transactionId && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Transaction ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                      {payment.transactionId}
                    </Typography>
                  </Grid>
                )}

                {payment.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Remarks
                    </Typography>
                    <Typography variant="body1">{payment.remarks}</Typography>
                  </Grid>
                )}
              </Grid>
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
              <WorkflowStatus workflow={workflow} entityType="payment" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="payment"
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

