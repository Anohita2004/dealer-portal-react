import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Target,
  Calendar,
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Users,
  MapPin,
  Building2,
  TrendingUp,
  Info,
} from "lucide-react";
import { campaignAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import CampaignForm from "../components/CampaignForm";
import CampaignTargeting from "../components/CampaignTargeting";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import { explainCampaignVisibility, getCampaignLifecycleState, formatTargetAudience } from "../utils/campaignTargeting";
import { isAccountsUser } from "../utils/accountsPermissions";

export default function Campaigns() {
  const { user } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Check if user can manage campaigns - handle different role formats
  const userRole = user?.role || user?.roleDetails?.name || user?.roleName || "";
  const canManage = !isAccountsUser(user) && (userRole === "super_admin" || userRole === "key_user");

  // Debug: Log user role to verify (can be removed in production)
  useEffect(() => {
    if (user) {
      console.log("Campaigns page - User role:", userRole, "Can manage:", canManage, "User object:", user);
    }
  }, [user, userRole, canManage]);

  // Fetch campaigns (automatically scoped by backend based on targetAudience)
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      let data;

      if (canManage) {
        // Admins see all campaigns
        data = await campaignAPI.getCampaigns();
      } else {
        // Dealers see only campaigns targeting them
        data = await campaignAPI.getActiveCampaigns();
      }

      setCampaigns(Array.isArray(data) ? data : data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [canManage]);

  // Delete campaign
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await campaignAPI.deleteCampaign(id);
      toast.success("Campaign deleted successfully");
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      toast.error(err.response?.data?.error || "Failed to delete campaign");
    }
  };

  // View analytics
  const handleViewAnalytics = async (campaignId) => {
    try {
      setAnalyticsLoading(true);
      const data = await campaignAPI.getCampaignAnalytics(campaignId);
      setAnalyticsData(data);
      setAnalyticsOpen(true);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      toast.error("Failed to load campaign analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Open form for editing
  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setFormOpen(true);
  };

  // Open form for creating
  const handleCreate = () => {
    setSelectedCampaign(null);
    setFormOpen(true);
  };

  // Close form
  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedCampaign(null);
  };

  // Get target audience display
  const getTargetDisplay = (targetAudience) => {
    if (!targetAudience || targetAudience.length === 0) {
      return "All Dealers";
    }

    const hasAll = targetAudience.some((t) => t.type === "all");
    if (hasAll) return "All Dealers";

    return targetAudience.map((t, idx) => {
      const labels = {
        region: "Region",
        territory: "Territory",
        dealer: "Dealer",
        team: "Team",
      };
      return `${labels[t.type] || t.type}${idx < targetAudience.length - 1 ? ", " : ""}`;
    }).join("");
  };

  // Use lifecycle state utility instead of custom function

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Campaigns"
        subtitle={canManage ? "Manage marketing campaigns" : "View available campaigns"}
        action={
          canManage && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Create Campaign
            </Button>
          )
        }
      />

      {loading ? (
        <Typography>Loading campaigns...</Typography>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No campaigns found.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => {
            const lifecycleState = getCampaignLifecycleState(campaign);
            const visibility = explainCampaignVisibility(campaign, user);
            return (
              <Grid item xs={12} md={6} key={campaign.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        {campaign.campaignName}
                      </Typography>
                      <Chip
                        label={lifecycleState.label}
                        color={lifecycleState.color}
                        size="small"
                        title={lifecycleState.description}
                      />
                    </Box>

                    {/* Why User Sees This Campaign - Backend Intelligence */}
                    {!canManage && visibility.isTargeted && (
                      <Alert severity="info" icon={<Info size={18} />} sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Why you see this campaign:
                        </Typography>
                        <Typography variant="caption">
                          {visibility.explanation}
                        </Typography>
                      </Alert>
                    )}

                    <Chip
                      label={campaign.campaignType.replace("_", " ").toUpperCase()}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {campaign.description || "No description"}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <Calendar size={16} />
                      <Typography variant="caption">
                        {new Date(campaign.startDate).toLocaleDateString()}
                      </Typography>
                      <ArrowRight size={14} />
                      <Typography variant="caption">
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {campaign.discountPercentage > 0 && (
                      <Chip
                        icon={<TrendingUp size={14} />}
                        label={`${campaign.discountPercentage}% Discount`}
                        color="success"
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Target size={14} />
                        Target: {formatTargetAudience(campaign.targetAudience)}
                      </Typography>
                      {lifecycleState.daysRemaining !== undefined && lifecycleState.state === "active" && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          {lifecycleState.daysRemaining} day(s) remaining
                        </Typography>
                      )}
                      {lifecycleState.daysRemaining !== undefined && lifecycleState.state === "upcoming" && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          Starts in {lifecycleState.daysRemaining} day(s)
                        </Typography>
                      )}
                    </Box>

                    {campaign.productGroup && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        Product Group: {campaign.productGroup}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {canManage && (
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <Tooltip title="View Analytics">
                          <IconButton
                            size="small"
                            onClick={() => handleViewAnalytics(campaign.id)}
                          >
                            <BarChart3 size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Campaign">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(campaign)}
                          >
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Campaign">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Campaign Form Dialog */}
      <CampaignForm
        open={formOpen}
        onClose={handleFormClose}
        campaign={selectedCampaign}
        onSuccess={fetchCampaigns}
      />

      {/* Analytics Dialog */}
      <Dialog open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Campaign Analytics</DialogTitle>
        <DialogContent>
          {analyticsLoading ? (
            <Typography>Loading analytics...</Typography>
          ) : analyticsData ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {analyticsData.campaignName}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Participation
                      </Typography>
                      <Typography variant="h6">
                        {analyticsData.participation?.participated || 0} / {analyticsData.participation?.totalTargeted || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {analyticsData.participation?.participationRate || 0}% participation rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="h6">
                        ₹{Number(analyticsData.revenue?.total || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Attributed: ₹{Number(analyticsData.revenue?.attributed || 0).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {analyticsData.period && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Period: {new Date(analyticsData.period.start).toLocaleDateString()} - {new Date(analyticsData.period.end).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>No analytics data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
