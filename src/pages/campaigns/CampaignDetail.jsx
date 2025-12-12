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
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { ArrowLeft, Users, Calendar, Target } from "lucide-react";
import { campaignAPI } from "../../services/api";
import { useWorkflow } from "../../hooks/useWorkflow";
import {
  WorkflowStatus,
  WorkflowTimeline,
  ApprovalActions,
  WorkflowProgressBar,
} from "../../components/workflow";
import PageHeader from "../../components/PageHeader";

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const {
    workflow,
    loading: workflowLoading,
    error: workflowError,
    approve,
    reject,
  } = useWorkflow("campaign", id);

  // Fetch campaign details
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const [campaignResponse, analyticsResponse] = await Promise.allSettled([
          campaignAPI.getCampaignById(id),
          campaignAPI.getCampaignAnalytics(id).catch(() => null),
        ]);

        if (campaignResponse.status === "fulfilled") {
          setCampaign(campaignResponse.value.campaign || campaignResponse.value.data || campaignResponse.value);
        }

        if (analyticsResponse.status === "fulfilled" && analyticsResponse.value) {
          setAnalytics(analyticsResponse.value.analytics || analyticsResponse.value);
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError(err.response?.data?.error || err.message || "Failed to fetch campaign");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
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

  if (error || !campaign) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Campaign not found"}</Alert>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate("/campaigns")}
          sx={{ mt: 2 }}
        >
          Back to Campaigns
        </Button>
      </Box>
    );
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  // Format target audience
  const formatTargetAudience = (targetAudience) => {
    if (!targetAudience) return "All Dealers";
    if (typeof targetAudience === "string") return targetAudience;
    if (Array.isArray(targetAudience)) {
      if (targetAudience.length === 0) return "All Dealers";
      return targetAudience.join(", ");
    }
    return JSON.stringify(targetAudience);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={campaign.name || campaign.title || `Campaign ${campaign.id}`}
        subtitle="View campaign details and approval workflow"
      />

      <Button
        startIcon={<ArrowLeft />}
        onClick={() => navigate("/campaigns")}
        sx={{ mb: 3 }}
      >
        Back to Campaigns
      </Button>

      {workflowError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {workflowError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Campaign Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Campaign Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Campaign Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {campaign.name || campaign.title || campaign.id}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={campaign.status?.toUpperCase() || "PENDING"}
                    color={
                      campaign.status === "approved" || campaign.status === "active"
                        ? "success"
                        : campaign.status === "rejected"
                        ? "error"
                        : campaign.status === "ended"
                        ? "default"
                        : "warning"
                    }
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">{formatDate(campaign.startDate)}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography variant="body1">{formatDate(campaign.endDate)}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Target Audience
                  </Typography>
                  <Chip
                    icon={<Target size={16} />}
                    label={formatTargetAudience(campaign.targetAudience)}
                    variant="outlined"
                  />
                </Grid>

                {campaign.description && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1">{campaign.description}</Typography>
                  </Grid>
                )}

                {campaign.discount && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Discount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "success.main" }}>
                      {campaign.discount}%
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Campaign Analytics */}
          {analytics && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Campaign Analytics
                </Typography>
                <Grid container spacing={2}>
                  {analytics.totalDealers && (
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Users size={24} color="#3b82f6" style={{ margin: "0 auto 8px" }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {analytics.totalDealers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Dealers
                        </Typography>
                      </Card>
                    </Grid>
                  )}
                  {analytics.participationRate !== undefined && (
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Target size={24} color="#22c55e" style={{ margin: "0 auto 8px" }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          {analytics.participationRate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Participation Rate
                        </Typography>
                      </Card>
                    </Grid>
                  )}
                  {analytics.totalRevenue && (
                    <Grid item xs={12} sm={4}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: "success.main" }}>
                          ₹{analytics.totalRevenue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Revenue
                        </Typography>
                      </Card>
                    </Grid>
                  )}
                </Grid>
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
              <WorkflowStatus workflow={workflow} entityType="campaign" />
            </Box>
          )}

          {/* Approval Actions */}
          {workflow && (
            <Box sx={{ mt: 3 }}>
              <ApprovalActions
                workflow={workflow}
                entityType="campaign"
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

