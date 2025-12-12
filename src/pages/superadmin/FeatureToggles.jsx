import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import { Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { featureToggleAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function FeatureToggles() {
  const [toggles, setToggles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingToggle, setEditingToggle] = useState(null);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
    isEnabled: true,
    config: {},
  });

  useEffect(() => {
    fetchToggles();
  }, []);

  const fetchToggles = async () => {
    try {
      setLoading(true);
      const data = await featureToggleAPI.getFeatureToggles();
      setToggles(Array.isArray(data) ? data : data.toggles || []);
    } catch (error) {
      console.error("Failed to fetch feature toggles:", error);
      toast.error("Failed to load feature toggles");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (toggle) => {
    try {
      const updated = await featureToggleAPI.putFeatureToggle(toggle.key, {
        ...toggle,
        isEnabled: !toggle.isEnabled,
      });
      toast.success(`Feature ${updated.isEnabled ? "enabled" : "disabled"}`);
      fetchToggles();
    } catch (error) {
      console.error("Failed to toggle feature:", error);
      toast.error("Failed to update feature toggle");
    }
  };

  const handleOpenDialog = (toggle = null) => {
    if (toggle) {
      setEditingToggle(toggle);
      setFormData({
        key: toggle.key,
        name: toggle.name || "",
        description: toggle.description || "",
        isEnabled: toggle.isEnabled,
        config: toggle.config || {},
      });
    } else {
      setEditingToggle(null);
      setFormData({
        key: "",
        name: "",
        description: "",
        isEnabled: true,
        config: {},
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingToggle) {
        await featureToggleAPI.putFeatureToggle(editingToggle.key, formData);
        toast.success("Feature toggle updated");
      } else {
        await featureToggleAPI.updateFeatureToggle(formData);
        toast.success("Feature toggle created");
      }
      setDialogOpen(false);
      fetchToggles();
    } catch (error) {
      console.error("Failed to save feature toggle:", error);
      toast.error(error.response?.data?.error || "Failed to save feature toggle");
    }
  };

  if (loading) {
    return <Typography>Loading feature toggles...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Feature Toggles"
        subtitle="Manage system feature toggles"
        action={
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDialog()}
          >
            Create Toggle
          </Button>
        }
      />

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {toggles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No feature toggles found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              toggles.map((toggle) => (
                <TableRow key={toggle.key}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {toggle.key}
                    </Typography>
                  </TableCell>
                  <TableCell>{toggle.name || toggle.key}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {toggle.description || "No description"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={toggle.isEnabled ? "Enabled" : "Disabled"}
                      color={toggle.isEnabled ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleToggle(toggle)}
                      color={toggle.isEnabled ? "success" : "default"}
                    >
                      {toggle.isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(toggle)}>
                      <Edit size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingToggle ? "Edit Feature Toggle" : "Create Feature Toggle"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              required
              disabled={!!editingToggle}
              helperText="Unique identifier (e.g., pricing_approvals)"
            />
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingToggle ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

