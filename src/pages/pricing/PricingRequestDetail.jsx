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
  Divider,
} from "@mui/material";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { pricingAPI } from "../../services/api";
import { useWorkflow } from "../../hooks/useWorkflow";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "../../components/workflow";
import PageHeader from "../../components/PageHeader";

export default function PricingRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pricingRequest, setPricingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    workflow,
    loading: workflowLoading,
    error: workflowError,
    approve,
    reject,
  } = useWorkflow("pricing", id);

  // Fetch pricing request details
  useEffect(() => {
    const fetchPricingRequest = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await pricingAPI.getRequests({ id });
        // Handle different response formats
        const requests = response.pricingRequests || response.requests || response.data || response;
        const request = Array.isArray(requests) ? requests.find((r) => r.id === id) : requests;
        setPricingRequest(request);
      } catch (err) {
        console.error("Error fetching pricing request:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch pricing request");
      } finally {
        setLoading(false);
      }
    };

    fetchPricingRequest();
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

  if (loading || workflowLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !pricingRequest) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Pricing request not found"}</Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/pricing")}
          sx={{ mt: 2 }}
        >
          Back to Pricing Requests
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

  const oldPrice = pricingRequest.oldPrice || pricingRequest.currentPrice || 0;
  const newPrice = pricingRequest.newPrice || pricingRequest.requestedPrice || 0;
  const priceChange = newPrice - oldPrice;
  const priceChangePercent = oldPrice > 0 ? ((priceChange / oldPrice) * 100).toFixed(2) : 0;
  const isIncrease = priceChange > 0;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={`Pricing Request ${pricingRequest.requestNumber || pricingRequest.id}`}
        subtitle="View pricing request details and approval workflow"
      />

      <Button
        startIcon={<ArrowLeft />}
        onClick={() => navigate("/pricing")}
        sx={{ mb: 3 }}
      >
        Back to Pricing Requests
      </Button>

      {workflowError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {workflowError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Pricing Request Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Pricing Request Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Request Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {pricingRequest.requestNumber || pricingRequest.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={pricingRequest.status?.toUpperCase() || "PENDING"}
                    color={
                      pricingRequest.status === "approved"
                        ? "success"
                        : pricingRequest.status === "rejected"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Product/Material
                  </Typography>
                  <Typography variant="body1">
                    {pricingRequest.material?.name || pricingRequest.materialName || pricingRequest.productName || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Request Date
                  </Typography>
                  <Typography variant="body1">{formatDate(pricingRequest.requestDate || pricingRequest.createdAt)}</Typography>
                </Grid>

                {pricingRequest.requestedBy && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Requested By
                    </Typography>
                    <Typography variant="body1">
                      {pricingRequest.requestedBy?.username || pricingRequest.requestedBy?.name || "N/A"}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Price Comparison */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Price Change
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Current Price
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {formatCurrency(oldPrice)}
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: isIncrease ? "error.50" : "success.50",
                      borderColor: isIncrease ? "error.200" : "success.200",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      New Price
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {formatCurrency(newPrice)}
                      </Typography>
                      {isIncrease ? (
                        <TrendingUp size={24} color="#ef4444" />
                      ) : (
                        <TrendingDown size={24} color="#22c55e" />
                      )}
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: isIncrease ? "error.50" : "success.50",
                      borderColor: isIncrease ? "error.200" : "success.200",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Price Change
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: isIncrease ? "error.main" : "success.main",
                        }}
                      >
                        {isIncrease ? "+" : ""}
                        {formatCurrency(priceChange)} ({isIncrease ? "+" : ""}
                        {priceChangePercent}%)
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {pricingRequest.reason && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Reason for Price Change
                  </Typography>
                  <Typography variant="body1">{pricingRequest.reason}</Typography>
                </>
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
              <WorkflowStatus workflow={workflow} entityType="pricing" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="pricing"
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

