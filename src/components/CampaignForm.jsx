import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Autocomplete,
  Chip,
  Alert,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import { Package, Calendar, Percent, FileText, Target, Info } from "lucide-react";
import { campaignAPI, materialAPI } from "../services/api";
import CampaignTargeting from "./CampaignTargeting";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const CampaignForm = ({ open, onClose, campaign = null, onSuccess }) => {
  const { user } = useAuth();
  
  // Check role - handle both string role and roleDetails.name
  const userRole = user?.role || user?.roleDetails?.name || user?.roleName || "";
  const canManage = userRole === "super_admin" || userRole === "key_user";
  
  // Debug: Log role check
  useEffect(() => {
    if (open) {
      console.log("CampaignForm - User role:", userRole, "Can manage:", canManage, "User object:", user);
    }
  }, [open, userRole, canManage, user]);

  const [formData, setFormData] = useState({
    campaignName: "",
    campaignType: "promotion",
    description: "",
    startDate: "",
    endDate: "",
    productGroup: "",
    productIds: [],
    discountPercentage: 0,
    terms: "",
    isActive: true,
    targetAudience: [],
  });

  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialGroups, setMaterialGroups] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      loadMaterials();
    }
  }, [open]);

  useEffect(() => {
    if (campaign) {
      setFormData({
        campaignName: campaign.campaignName || "",
        campaignType: campaign.campaignType || "promotion",
        description: campaign.description || "",
        startDate: campaign.startDate ? campaign.startDate.split("T")[0] : "",
        endDate: campaign.endDate ? campaign.endDate.split("T")[0] : "",
        productGroup: campaign.productGroup || "",
        productIds: campaign.productIds || campaign.products || [],
        discountPercentage: campaign.discountPercentage || 0,
        terms: campaign.terms || "",
        isActive: campaign.isActive !== undefined ? campaign.isActive : true,
        targetAudience: campaign.targetAudience || [],
      });
    } else {
      // Reset form for new campaign
      setFormData({
        campaignName: "",
        campaignType: "promotion",
        description: "",
        startDate: "",
        endDate: "",
        productGroup: "",
        productIds: [],
        discountPercentage: 0,
        terms: "",
        isActive: true,
        targetAudience: [],
      });
    }
    setErrors({});
  }, [campaign, open]);

  const loadMaterials = async () => {
    try {
      const [materialsData, groupsData] = await Promise.all([
        materialAPI.getMaterials().catch(() => []),
        materialAPI.getMaterialGroups().catch(() => []),
      ]);

      setMaterials(Array.isArray(materialsData) ? materialsData : materialsData?.materials || materialsData?.data || []);
      setMaterialGroups(Array.isArray(groupsData) ? groupsData : groupsData?.groups || groupsData?.data || []);
    } catch (err) {
      console.error("Failed to load materials:", err);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.campaignName || formData.campaignName.trim().length < 3) {
      newErrors.campaignName = "Campaign name must be at least 3 characters";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      newErrors.discountPercentage = "Discount must be between 0 and 100";
    }

    if (formData.targetAudience.length === 0) {
      newErrors.targetAudience = "Please select at least one target audience";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        productIds: Array.isArray(formData.productIds) 
          ? formData.productIds.map(p => typeof p === 'object' ? p.id : p)
          : [],
      };

      if (campaign) {
        await campaignAPI.updateCampaign(campaign.id, payload);
        toast.success("Campaign updated successfully");
      } else {
        await campaignAPI.createCampaign(payload);
        toast.success("Campaign created successfully");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Campaign save error:", error);
      toast.error(error.response?.data?.error || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (targets) => {
    setFormData({ ...formData, targetAudience: targets });
  };

  if (!canManage) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Access Denied</DialogTitle>
        <DialogContent>
          <Alert severity="error">Only Super Admin and Key Users can create campaigns.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const filteredMaterials = materials.filter((m) => {
    if (formData.productGroup && m.productGroup !== formData.productGroup) return false;
    return true;
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Target size={24} />
            <Typography variant="h6">{campaign ? "Edit Campaign" : "Create Campaign"}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ mb: 3 }}>
            <Tab label="Basic Details" />
            <Tab label="Products & Pricing" />
            <Tab label="Targeting" />
          </Tabs>

          {/* Tab 1: Basic Details */}
          {selectedTab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Campaign Name"
                value={formData.campaignName}
                onChange={(e) => {
                  setFormData({ ...formData, campaignName: e.target.value });
                  if (errors.campaignName) setErrors({ ...errors, campaignName: "" });
                }}
                required
                fullWidth
                error={!!errors.campaignName}
                helperText={errors.campaignName}
                InputProps={{
                  startAdornment: <Target size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  value={formData.campaignType}
                  label="Campaign Type"
                  onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                >
                  <MenuItem value="promotion">Promotion</MenuItem>
                  <MenuItem value="sales_scheme">Sales Scheme</MenuItem>
                  <MenuItem value="seasonal_offer">Seasonal Offer</MenuItem>
                  <MenuItem value="product_launch">Product Launch</MenuItem>
                  <MenuItem value="bulk_discount">Bulk Discount</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Describe the campaign, its objectives, and benefits..."
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      if (errors.startDate) setErrors({ ...errors, startDate: "" });
                    }}
                    required
                    fullWidth
                    error={!!errors.startDate}
                    helperText={errors.startDate}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <Calendar size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData({ ...formData, endDate: e.target.value });
                      if (errors.endDate) setErrors({ ...errors, endDate: "" });
                    }}
                    required
                    fullWidth
                    error={!!errors.endDate}
                    helperText={errors.endDate}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <Calendar size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Terms & Conditions"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                multiline
                rows={3}
                fullWidth
                placeholder="Valid on bulk orders, minimum quantity required, payment terms, etc."
                InputProps={{
                  startAdornment: <FileText size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Activate Campaign Immediately"
              />
            </Box>
          )}

          {/* Tab 2: Products & Pricing */}
          {selectedTab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="info" icon={<Info size={18} />} sx={{ mb: 2 }}>
                Select specific products or product groups for this campaign. You can target all products or specific ones.
              </Alert>

              <FormControl fullWidth>
                <InputLabel>Product Group (Optional)</InputLabel>
                <Select
                  value={formData.productGroup}
                  label="Product Group (Optional)"
                  onChange={(e) => setFormData({ ...formData, productGroup: e.target.value })}
                >
                  <MenuItem value="">
                    <em>All Product Groups</em>
                  </MenuItem>
                  {materialGroups.map((group) => (
                    <MenuItem key={group.id || group} value={group.name || group}>
                      {group.name || group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                multiple
                options={filteredMaterials}
                getOptionLabel={(option) => option.name || option.materialName || option.code || String(option)}
                value={formData.productIds.filter((id) => {
                  const material = materials.find((m) => m.id === id || (typeof id === 'object' && m.id === id.id));
                  return material;
                })}
                onChange={(e, newValue) => {
                  setFormData({ ...formData, productIds: newValue });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Products (Optional)"
                    placeholder="Select specific products for this campaign"
                    helperText="Leave empty to apply to all products in the selected group"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const material = typeof option === 'object' ? option : materials.find((m) => m.id === option);
                    return (
                      <Chip
                        {...getTagProps({ index })}
                        key={material?.id || option}
                        label={material?.name || material?.materialName || option}
                        icon={<Package size={14} />}
                      />
                    );
                  })
                }
              />

              <TextField
                label="Discount Percentage"
                type="number"
                value={formData.discountPercentage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, discountPercentage: value });
                  if (errors.discountPercentage) setErrors({ ...errors, discountPercentage: "" });
                }}
                fullWidth
                error={!!errors.discountPercentage}
                helperText={errors.discountPercentage || "Enter discount percentage (0-100)"}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                InputProps={{
                  startAdornment: <Percent size={18} style={{ marginRight: 8, opacity: 0.5 }} />,
                }}
              />

              {formData.productIds.length > 0 && (
                <Alert severity="success">
                  {formData.productIds.length} product(s) selected for this campaign
                </Alert>
              )}
            </Box>
          )}

          {/* Tab 3: Targeting */}
          {selectedTab === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Alert severity="info" icon={<Info size={18} />} sx={{ mb: 2 }}>
                Select target audience for this campaign. You can target all dealers, specific regions, territories, dealers, or teams.
              </Alert>

              <CampaignTargeting value={formData.targetAudience} onChange={handleTargetChange} />

              {errors.targetAudience && (
                <Alert severity="error">{errors.targetAudience}</Alert>
              )}

              {formData.targetAudience.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Targets:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {formData.targetAudience.map((target, idx) => (
                      <Chip
                        key={idx}
                        label={`${target.type}: ${target.entityId || "All"}`}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={onClose} disabled={loading} variant="outlined">
            Cancel
          </Button>
          {selectedTab < 2 && (
            <Button onClick={() => setSelectedTab(selectedTab + 1)} variant="outlined">
              Next
            </Button>
          )}
          {selectedTab > 0 && (
            <Button onClick={() => setSelectedTab(selectedTab - 1)} variant="outlined">
              Back
            </Button>
          )}
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving..." : campaign ? "Update Campaign" : "Create Campaign"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CampaignForm;

