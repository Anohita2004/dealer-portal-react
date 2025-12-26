import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    CircularProgress,
    Alert,
    Tooltip,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import {
    Plus,
    Edit2,
    Trash2,
    Package,
    RefreshCw,
    Search,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import { materialAPI } from "../../services/api";

// ======================== INVENTORY MANAGEMENT ========================
// Manage global material stock (Super Admin view)
// Shows materials from /materials endpoint with stock tracking
// ======================================================================

export default function InventoryManagement() {
    // Data state
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Pagination & filtering
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [search, setSearch] = useState("");
    const [stockFilter, setStockFilter] = useState("all"); // all, low, out

    // Dialog state
    const [formDialog, setFormDialog] = useState({ open: false, mode: "create", data: null });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
    const [adjustDialog, setAdjustDialog] = useState({ open: false, item: null, adjustment: 0, reason: "" });

    // Form state
    const [form, setForm] = useState({
        name: "",
        materialNumber: "",
        stock: "",
        reorderLevel: "",
        uom: "EA",
        description: "",
    });

    // ======================== DATA LOADING ========================

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await materialAPI.getMaterials().catch(() => ({}));
            const items = Array.isArray(response)
                ? response
                : response?.materials || response?.items || response?.data || [];
            setMaterials(items);
        } catch (err) {
            console.error("Failed to load materials:", err);
            toast.error("Failed to load materials data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ======================== FILTERING ========================

    const filteredMaterials = materials.filter((item) => {
        const name = (item.name || item.product || "").toLowerCase();
        const matNum = (item.materialNumber || "").toLowerCase();
        const matchesSearch =
            name.includes(search.toLowerCase()) || matNum.includes(search.toLowerCase());

        const stock = item.stock ?? item.available ?? 0;
        const reorderLevel = item.reorderLevel || 10;

        if (stockFilter === "low") {
            return matchesSearch && stock <= reorderLevel && stock > 0;
        }
        if (stockFilter === "out") {
            return matchesSearch && stock === 0;
        }
        return matchesSearch;
    });

    const paginatedMaterials = filteredMaterials.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    // Stats
    const stats = {
        total: materials.length,
        lowStock: materials.filter((i) => {
            const stock = i.stock ?? i.available ?? 0;
            return stock <= (i.reorderLevel || 10) && stock > 0;
        }).length,
        outOfStock: materials.filter((i) => (i.stock ?? i.available ?? 0) === 0).length,
        totalStock: materials.reduce((sum, i) => sum + (i.stock ?? i.available ?? 0), 0),
    };

    // ======================== FORM HANDLERS ========================

    const openFormDialog = (mode, data = null) => {
        setForm({
            name: data?.name || data?.product || "",
            materialNumber: data?.materialNumber || "",
            stock: data?.stock ?? data?.available ?? "",
            reorderLevel: data?.reorderLevel || "",
            uom: data?.uom || "EA",
            description: data?.description || "",
        });
        setFormDialog({ open: true, mode, data });
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error("Material name is required");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                materialNumber: form.materialNumber.trim() || undefined,
                stock: form.stock !== "" ? Number(form.stock) : undefined,
                available: form.stock !== "" ? Number(form.stock) : undefined,
                reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : undefined,
                uom: form.uom || "EA",
                description: form.description.trim() || undefined,
            };

            if (formDialog.mode === "edit" && formDialog.data?.id) {
                await materialAPI.updateMaterial(formDialog.data.id, payload);
                toast.success("Material updated successfully");
            } else {
                await materialAPI.createMaterial(payload);
                toast.success("Material created successfully");
            }

            setFormDialog({ open: false, mode: "create", data: null });
            loadData();
        } catch (err) {
            console.error("Failed to save material:", err);
            toast.error(err.response?.data?.error || "Failed to save material");
        } finally {
            setSaving(false);
        }
    };

    // ======================== DELETE HANDLER ========================

    const handleDelete = async () => {
        try {
            await materialAPI.deleteMaterial(deleteDialog.item.id);
            toast.success("Material deleted successfully");
            setDeleteDialog({ open: false, item: null });
            loadData();
        } catch (err) {
            console.error("Failed to delete material:", err);
            toast.error(err.response?.data?.error || "Failed to delete material");
        }
    };

    // ======================== STOCK ADJUSTMENT ========================

    const openAdjustDialog = (item) => {
        setAdjustDialog({ open: true, item, adjustment: 0, reason: "" });
    };

    const handleAdjustStock = async () => {
        const { item, adjustment, reason } = adjustDialog;
        const currentStock = item.stock ?? item.available ?? 0;
        const newStock = currentStock + Number(adjustment);

        if (newStock < 0) {
            toast.error("Stock cannot go below 0");
            return;
        }

        try {
            await materialAPI.updateMaterial(item.id, {
                ...item,
                stock: newStock,
                available: newStock,
                adjustmentReason: reason || undefined,
            });
            toast.success(`Stock adjusted by ${adjustment > 0 ? "+" : ""}${adjustment}`);
            setAdjustDialog({ open: false, item: null, adjustment: 0, reason: "" });
            loadData();
        } catch (err) {
            console.error("Failed to adjust stock:", err);
            toast.error(err.response?.data?.error || "Failed to adjust stock");
        }
    };

    // ======================== STOCK STATUS ========================

    const getStockStatus = (item) => {
        const stock = item.stock ?? item.available ?? 0;
        const reorderLevel = item.reorderLevel || 10;

        if (stock === 0) {
            return { label: "Out of Stock", color: "error", icon: <AlertTriangle size={14} /> };
        }
        if (stock <= reorderLevel) {
            return { label: "Low Stock", color: "warning", icon: <TrendingDown size={14} /> };
        }
        return { label: "In Stock", color: "success", icon: <TrendingUp size={14} /> };
    };

    // ======================== RENDER ========================

    if (loading) {
        return (
            <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Inventory Management"
                subtitle="Manage global material stock levels and track inventory"
                actions={[
                    <Button
                        key="refresh"
                        variant="outlined"
                        startIcon={<RefreshCw size={18} />}
                        onClick={loadData}
                    >
                        Refresh
                    </Button>,
                    <Button
                        key="add"
                        variant="contained"
                        startIcon={<Plus size={18} />}
                        onClick={() => openFormDialog("create")}
                    >
                        Add Material
                    </Button>,
                ]}
            />

            {/* Stats Cards */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: "center" }}>
                    <Typography variant="h4" color="primary" fontWeight={700}>
                        {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Total Materials
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: "center", borderLeft: "4px solid", borderColor: "warning.main" }}>
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                        {stats.lowStock}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Low Stock
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: "center", borderLeft: "4px solid", borderColor: "error.main" }}>
                    <Typography variant="h4" color="error.main" fontWeight={700}>
                        {stats.outOfStock}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Out of Stock
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: 1, minWidth: 150, textAlign: "center", borderLeft: "4px solid", borderColor: "success.main" }}>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                        {stats.totalStock.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Total Units
                    </Typography>
                </Paper>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                    <TextField
                        size="small"
                        placeholder="Search by name or material number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ minWidth: 300 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Stock Status</InputLabel>
                        <Select
                            value={stockFilter}
                            label="Stock Status"
                            onChange={(e) => setStockFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Items</MenuItem>
                            <MenuItem value="low">Low Stock</MenuItem>
                            <MenuItem value="out">Out of Stock</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                        Showing {filteredMaterials.length} of {materials.length} materials
                    </Typography>
                </Box>
            </Paper>

            {/* Materials Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: "grey.100" }}>
                            <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Material Number</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Stock</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Reorder Level</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>UOM</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedMaterials.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        {materials.length === 0 ? "No materials found. Click 'Add Material' to create one." : "No matching materials."}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedMaterials.map((item) => {
                                const status = getStockStatus(item);
                                const stock = item.stock ?? item.available ?? 0;
                                return (
                                    <TableRow key={item.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Package size={18} />
                                                <Box>
                                                    <Typography fontWeight={500}>{item.name || item.product}</Typography>
                                                    {item.description && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{item.materialNumber || "-"}</TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={600} color={status.color + ".main"}>
                                                {stock.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">{item.reorderLevel || "-"}</TableCell>
                                        <TableCell>{item.uom || "EA"}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                icon={status.icon}
                                                label={status.label}
                                                color={status.color}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Adjust Stock">
                                                <IconButton size="small" onClick={() => openAdjustDialog(item)}>
                                                    <TrendingUp size={16} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openFormDialog("edit", item)}>
                                                    <Edit2 size={16} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item })}>
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
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredMaterials.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

            {/* ======================== ADD/EDIT DIALOG ======================== */}
            <Dialog open={formDialog.open} onClose={() => setFormDialog({ open: false, mode: "create", data: null })} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {formDialog.mode === "edit" ? "Edit Material" : "Add Material"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Material Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        margin="normal"
                        required
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="Material Number"
                        value={form.materialNumber}
                        onChange={(e) => setForm({ ...form, materialNumber: e.target.value })}
                        margin="normal"
                        placeholder="e.g., MAT001"
                    />
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Stock Quantity"
                            value={form.stock}
                            onChange={(e) => setForm({ ...form, stock: e.target.value })}
                            margin="normal"
                            type="number"
                            inputProps={{ min: 0 }}
                        />
                        <TextField
                            fullWidth
                            label="Reorder Level"
                            value={form.reorderLevel}
                            onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                            margin="normal"
                            type="number"
                            inputProps={{ min: 0 }}
                            helperText="Alert when stock falls below"
                        />
                    </Box>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Unit of Measure</InputLabel>
                        <Select
                            value={form.uom}
                            label="Unit of Measure"
                            onChange={(e) => setForm({ ...form, uom: e.target.value })}
                        >
                            <MenuItem value="EA">EA (Each)</MenuItem>
                            <MenuItem value="KG">KG (Kilogram)</MenuItem>
                            <MenuItem value="L">L (Liter)</MenuItem>
                            <MenuItem value="M">M (Meter)</MenuItem>
                            <MenuItem value="BOX">BOX</MenuItem>
                            <MenuItem value="SET">SET</MenuItem>
                            <MenuItem value="PCS">PCS (Pieces)</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        margin="normal"
                        multiline
                        rows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormDialog({ open: false, mode: "create", data: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}>
                        {saving ? <CircularProgress size={20} /> : formDialog.mode === "edit" ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ======================== STOCK ADJUSTMENT DIALOG ======================== */}
            <Dialog open={adjustDialog.open} onClose={() => setAdjustDialog({ open: false, item: null, adjustment: 0, reason: "" })} maxWidth="sm" fullWidth>
                <DialogTitle>Adjust Stock</DialogTitle>
                <DialogContent>
                    {adjustDialog.item && (
                        <>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Adjusting stock for: <strong>{adjustDialog.item.name || adjustDialog.item.product}</strong>
                                <br />
                                Current stock: <strong>{adjustDialog.item.stock ?? adjustDialog.item.available ?? 0}</strong>
                            </Alert>
                            <TextField
                                fullWidth
                                label="Adjustment Amount"
                                value={adjustDialog.adjustment}
                                onChange={(e) => setAdjustDialog({ ...adjustDialog, adjustment: e.target.value })}
                                margin="normal"
                                type="number"
                                helperText="Use positive numbers to add, negative to subtract"
                                autoFocus
                            />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                New stock will be:{" "}
                                <strong>
                                    {Math.max(0, (adjustDialog.item?.stock ?? adjustDialog.item?.available ?? 0) + Number(adjustDialog.adjustment || 0))}
                                </strong>
                            </Typography>
                            <TextField
                                fullWidth
                                label="Reason for Adjustment (optional)"
                                value={adjustDialog.reason}
                                onChange={(e) => setAdjustDialog({ ...adjustDialog, reason: e.target.value })}
                                margin="normal"
                                multiline
                                rows={2}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAdjustDialog({ open: false, item: null, adjustment: 0, reason: "" })}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdjustStock} variant="contained" color="primary">
                        Apply Adjustment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ======================== DELETE CONFIRMATION DIALOG ======================== */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete{" "}
                        <strong>"{deleteDialog.item?.name || deleteDialog.item?.product}"</strong>?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
