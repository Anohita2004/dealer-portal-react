import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Collapse,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Boxes,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import api, { materialAPI } from "../services/api";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, material: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, material: null });

  // Group form
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  // Material form
  const [formData, setFormData] = useState({
    name: "",
    materialNumber: "",
    uom: "",
    description: "",
    materialGroupId: "",
    stock: "",
    reorderLevel: "",
    plant: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsRes, groupsRes] = await Promise.all([
        materialAPI.getMaterials().catch(() => ({ materials: [] })),
        materialAPI.getMaterialGroups().catch(() => ({ groups: [] })),
      ]);

      const materialsData = materialsRes?.materials || materialsRes?.data || (Array.isArray(materialsRes) ? materialsRes : []);
      const groupsData = groupsRes?.groups || groupsRes?.data || (Array.isArray(groupsRes) ? groupsRes : []);

      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load materials");
      setMaterials([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaterial = async () => {
    if (!formData.name || !formData.materialNumber) {
      toast.error("Material name and number are required");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        materialNumber: formData.materialNumber,
        uom: formData.uom || "EA",
        description: formData.description,
        materialGroupId: formData.materialGroupId || null,
        stock: formData.stock ? Number(formData.stock) : 0,
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 0,
        plant: formData.plant || null,
      };

      await materialAPI.createMaterial(payload);
      toast.success("Material created successfully");
      resetForm();
      setCreateFormOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create material:", error);
      toast.error("Failed to create material: " + (error?.response?.data?.error || error?.message || "Unknown error"));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || !groupCode) {
      toast.error("Group name and code are required");
      return;
    }

    try {
      await api.post("/materials/groups", {
        name: groupName,
        code: groupCode,
        description: groupDesc,
      });
      toast.success("Material group created successfully");
      setGroupName("");
      setGroupCode("");
      setGroupDesc("");
      setGroupFormOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group: " + (error?.response?.data?.error || error?.message || "Unknown error"));
    }
  };

  const handleEdit = (material) => {
    setEditDialog({ open: true, material });
    setFormData({
      name: material.name || "",
      materialNumber: material.materialNumber || "",
      uom: material.uom || "",
      description: material.description || "",
      materialGroupId: material.materialGroupId || "",
      stock: material.stock || "",
      reorderLevel: material.reorderLevel || "",
      plant: material.plant || "",
    });
  };

  const handleUpdateMaterial = async () => {
    try {
      const payload = {
        name: formData.name,
        materialNumber: formData.materialNumber,
        uom: formData.uom || "EA",
        description: formData.description,
        materialGroupId: formData.materialGroupId || null,
        stock: formData.stock ? Number(formData.stock) : 0,
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 0,
        plant: formData.plant || null,
      };

      await materialAPI.updateMaterial(editDialog.material.id, payload);
      toast.success("Material updated successfully");
      setEditDialog({ open: false, material: null });
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to update material:", error);
      toast.error("Failed to update material: " + (error?.response?.data?.error || error?.message || "Unknown error"));
    }
  };

  const handleDelete = async () => {
    try {
      await materialAPI.deleteMaterial(deleteDialog.material.id);
      toast.success("Material deleted successfully");
      setDeleteDialog({ open: false, material: null });
      fetchData();
    } catch (error) {
      console.error("Failed to delete material:", error);
      toast.error("Failed to delete material: " + (error?.response?.data?.error || error?.message || "Unknown error"));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      materialNumber: "",
      uom: "",
      description: "",
      materialGroupId: "",
      stock: "",
      reorderLevel: "",
      plant: "",
    });
  };

  const getStockStatus = (stock, reorderLevel) => {
    if (stock === 0 || stock === null) {
      return { label: "Out of Stock", color: "error" };
    }
    if (reorderLevel && stock < reorderLevel) {
      return { label: "Low Stock", color: "warning" };
    }
    return { label: "In Stock", color: "success" };
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      !searchTerm ||
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.materialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = !groupFilter || material.materialGroupId === groupFilter;
    
    const stock = material.stock ?? 0;
    const reorderLevel = material.reorderLevel ?? 0;
    let matchesStock = true;
    if (stockFilter !== "all") {
      if (stockFilter === "low") {
        matchesStock = reorderLevel > 0 && stock < reorderLevel && stock > 0;
      } else if (stockFilter === "out") {
        matchesStock = stock === 0 || stock === null;
      } else if (stockFilter === "in") {
        matchesStock = stock > 0 && (reorderLevel === 0 || stock >= reorderLevel);
      }
    }
    
    return matchesSearch && matchesGroup && matchesStock;
  });

  const handleExport = async (format) => {
    try {
      toast.info("Export functionality coming soon");
      // TODO: Implement export
    } catch (error) {
      toast.error("Failed to export materials");
    }
  };

  return (
    <Box p={3}>
      <PageHeader
        title="Materials Management"
        subtitle="Create and manage materials and material groups"
        actions={[
          <Button
            key="export-pdf"
            variant="outlined"
            startIcon={<FileText size={18} />}
            onClick={() => handleExport("pdf")}
            sx={{ mr: 1 }}
          >
            Export PDF
          </Button>,
          <Button
            key="export-excel"
            variant="outlined"
            startIcon={<FileSpreadsheet size={18} />}
            onClick={() => handleExport("excel")}
            sx={{ mr: 1 }}
          >
            Export Excel
          </Button>,
          <Button
            key="refresh"
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={fetchData}
          >
            Refresh
          </Button>,
        ]}
      />

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Plus size={18} />}
            onClick={() => setCreateFormOpen(!createFormOpen)}
            sx={{ py: 1.5 }}
          >
            {createFormOpen ? "Hide" : "Create"} Material
            {createFormOpen ? <ChevronUp size={18} style={{ marginLeft: 8 }} /> : <ChevronDown size={18} style={{ marginLeft: 8 }} />}
          </Button>
        </Grid>
        <Grid item xs={12} md={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Boxes size={18} />}
            onClick={() => setGroupFormOpen(!groupFormOpen)}
            sx={{ py: 1.5 }}
          >
            {groupFormOpen ? "Hide" : "Create"} Material Group
            {groupFormOpen ? <ChevronUp size={18} style={{ marginLeft: 8 }} /> : <ChevronDown size={18} style={{ marginLeft: 8 }} />}
          </Button>
        </Grid>
      </Grid>

      {/* Create Material Form */}
      <Collapse in={createFormOpen}>
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Create New Material</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Material Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Material Number *"
                  value={formData.materialNumber}
                  onChange={(e) => setFormData({ ...formData, materialNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="UOM (Unit of Measure)"
                  value={formData.uom}
                  onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                  placeholder="EA, KGS, PCS, etc."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Reorder Level"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Plant/Warehouse"
                  value={formData.plant}
                  onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Material Group</InputLabel>
                  <Select
                    value={formData.materialGroupId}
                    onChange={(e) => setFormData({ ...formData, materialGroupId: e.target.value })}
                    label="Material Group"
                  >
                    <MenuItem value="">None</MenuItem>
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name} ({group.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleCreateMaterial} sx={{ mr: 2 }}>
                  Create Material
                </Button>
                <Button variant="outlined" onClick={() => { resetForm(); setCreateFormOpen(false); }}>
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Create Group Form */}
      <Collapse in={groupFormOpen}>
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Create Material Group</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Group Name *"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Group Code *"
                  value={groupCode}
                  onChange={(e) => setGroupCode(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Description"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleCreateGroup} sx={{ mr: 2 }}>
                  Create Group
                </Button>
                <Button variant="outlined" onClick={() => { setGroupName(""); setGroupCode(""); setGroupDesc(""); setGroupFormOpen(false); }}>
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Filters */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, material number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Material Group</InputLabel>
                <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} label="Material Group">
                  <MenuItem value="">All Groups</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} label="Stock Status">
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="low">Low Stock</MenuItem>
                  <MenuItem value="out">Out of Stock</MenuItem>
                  <MenuItem value="in">In Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            All Materials ({filteredMaterials.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Stock</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Reorder Level</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Plant</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Alert severity="info">No materials found</Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((material) => {
                    const stock = material.stock ?? 0;
                    const reorderLevel = material.reorderLevel ?? 0;
                    const status = getStockStatus(stock, reorderLevel);

                    return (
                      <TableRow key={material.id} hover>
                        <TableCell>{material.name || "N/A"}</TableCell>
                        <TableCell>{material.materialNumber || "N/A"}</TableCell>
                        <TableCell>{material.uom || "EA"}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{reorderLevel || "—"}</TableCell>
                        <TableCell>{material.plant || "—"}</TableCell>
                        <TableCell>{material.group?.name || "—"}</TableCell>
                        <TableCell>
                          <Chip label={status.label} size="small" color={status.color} />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit Material">
                            <IconButton size="small" onClick={() => handleEdit(material)}>
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Material">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, material })}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, material: null })} maxWidth="md" fullWidth>
        <DialogTitle>Edit Material</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Material Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Material Number *"
                value={formData.materialNumber}
                onChange={(e) => setFormData({ ...formData, materialNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="UOM"
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Reorder Level"
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plant/Warehouse"
                value={formData.plant}
                onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Material Group</InputLabel>
                <Select
                  value={formData.materialGroupId}
                  onChange={(e) => setFormData({ ...formData, materialGroupId: e.target.value })}
                  label="Material Group"
                >
                  <MenuItem value="">None</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name} ({group.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, material: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateMaterial}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, material: null })}>
        <DialogTitle>Delete Material</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog.material?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, material: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
