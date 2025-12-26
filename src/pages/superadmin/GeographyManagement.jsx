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
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    CircularProgress,
    Divider,
    Alert,
    Tooltip,
    Fade,
} from "@mui/material";
import {
    Plus,
    Edit2,
    Trash2,
    MapPin,
    Globe,
    Map,
    Navigation,
    ChevronRight,
    RefreshCw,
    Search,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import { geoAPI } from "../../services/api";

// ======================== GEOGRAPHY MANAGEMENT ========================
// Three-level hierarchy manager for Regions -> Areas -> Territories
// ======================================================================

export default function GeographyManagement() {
    // Data state
    const [regions, setRegions] = useState([]);
    const [areas, setAreas] = useState([]);
    const [territories, setTerritories] = useState([]);

    // Selection state
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);

    // Loading state
    const [loading, setLoading] = useState(true);
    const [savingRegion, setSavingRegion] = useState(false);
    const [savingArea, setSavingArea] = useState(false);
    const [savingTerritory, setSavingTerritory] = useState(false);

    // Dialog state
    const [regionDialog, setRegionDialog] = useState({ open: false, mode: "create", data: null });
    const [areaDialog, setAreaDialog] = useState({ open: false, mode: "create", data: null });
    const [territoryDialog, setTerritoryDialog] = useState({ open: false, mode: "create", data: null });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, type: null, item: null });

    // Search state
    const [regionSearch, setRegionSearch] = useState("");
    const [areaSearch, setAreaSearch] = useState("");
    const [territorySearch, setTerritorySearch] = useState("");

    // Form state
    const [regionForm, setRegionForm] = useState({ name: "", centroidLat: "", centroidLng: "" });
    const [areaForm, setAreaForm] = useState({ name: "" });
    const [territoryForm, setTerritoryForm] = useState({ name: "" });

    // ======================== DATA LOADING ========================

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [regionsRes, areasRes, territoriesRes] = await Promise.all([
                geoAPI.getRegions().catch(() => []),
                geoAPI.getAreas().catch(() => []),
                geoAPI.getTerritories().catch(() => []),
            ]);

            setRegions(Array.isArray(regionsRes) ? regionsRes : regionsRes?.regions || regionsRes?.data || []);
            setAreas(Array.isArray(areasRes) ? areasRes : areasRes?.areas || areasRes?.data || []);
            setTerritories(Array.isArray(territoriesRes) ? territoriesRes : territoriesRes?.territories || territoriesRes?.data || []);
        } catch (err) {
            console.error("Failed to load geography data:", err);
            toast.error("Failed to load geography data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ======================== FILTERED DATA ========================

    const filteredRegions = regions.filter((r) =>
        (r.name || r.regionName || "").toLowerCase().includes(regionSearch.toLowerCase())
    );

    const filteredAreas = areas
        .filter((a) => !selectedRegion || a.regionId === selectedRegion.id)
        .filter((a) => (a.name || a.areaName || "").toLowerCase().includes(areaSearch.toLowerCase()));

    const filteredTerritories = territories
        .filter((t) => !selectedArea || t.areaId === selectedArea.id)
        .filter((t) => (t.name || t.territoryName || "").toLowerCase().includes(territorySearch.toLowerCase()));

    // ======================== REGION HANDLERS ========================

    const openRegionDialog = (mode, data = null) => {
        setRegionForm({
            name: data?.name || data?.regionName || "",
            centroidLat: data?.centroidLat || "",
            centroidLng: data?.centroidLng || "",
        });
        setRegionDialog({ open: true, mode, data });
    };

    const handleSaveRegion = async () => {
        if (!regionForm.name.trim()) {
            toast.error("Region name is required");
            return;
        }

        try {
            setSavingRegion(true);
            const payload = {
                name: regionForm.name.trim(),
                centroidLat: regionForm.centroidLat ? Number(regionForm.centroidLat) : undefined,
                centroidLng: regionForm.centroidLng ? Number(regionForm.centroidLng) : undefined,
            };

            if (regionDialog.mode === "edit" && regionDialog.data?.id) {
                await geoAPI.updateRegion(regionDialog.data.id, payload);
                toast.success("Region updated successfully");
            } else {
                await geoAPI.createRegion(payload);
                toast.success("Region created successfully");
            }

            setRegionDialog({ open: false, mode: "create", data: null });
            loadData();
        } catch (err) {
            console.error("Failed to save region:", err);
            toast.error(err.response?.data?.error || "Failed to save region");
        } finally {
            setSavingRegion(false);
        }
    };

    // ======================== AREA HANDLERS ========================

    const openAreaDialog = (mode, data = null) => {
        if (!selectedRegion && mode === "create") {
            toast.error("Please select a region first");
            return;
        }
        setAreaForm({
            name: data?.name || data?.areaName || "",
        });
        setAreaDialog({ open: true, mode, data });
    };

    const handleSaveArea = async () => {
        if (!areaForm.name.trim()) {
            toast.error("Area name is required");
            return;
        }

        try {
            setSavingArea(true);
            const payload = {
                name: areaForm.name.trim(),
                regionId: selectedRegion?.id || areaDialog.data?.regionId,
            };

            if (areaDialog.mode === "edit" && areaDialog.data?.id) {
                await geoAPI.updateArea(areaDialog.data.id, payload);
                toast.success("Area updated successfully");
            } else {
                await geoAPI.createArea(payload);
                toast.success("Area created successfully");
            }

            setAreaDialog({ open: false, mode: "create", data: null });
            loadData();
        } catch (err) {
            console.error("Failed to save area:", err);
            toast.error(err.response?.data?.error || "Failed to save area");
        } finally {
            setSavingArea(false);
        }
    };

    // ======================== TERRITORY HANDLERS ========================

    const openTerritoryDialog = (mode, data = null) => {
        if (!selectedArea && mode === "create") {
            toast.error("Please select an area first");
            return;
        }
        setTerritoryForm({
            name: data?.name || data?.territoryName || "",
        });
        setTerritoryDialog({ open: true, mode, data });
    };

    const handleSaveTerritory = async () => {
        if (!territoryForm.name.trim()) {
            toast.error("Territory name is required");
            return;
        }

        try {
            setSavingTerritory(true);
            const payload = {
                name: territoryForm.name.trim(),
                areaId: selectedArea?.id || territoryDialog.data?.areaId,
            };

            if (territoryDialog.mode === "edit" && territoryDialog.data?.id) {
                await geoAPI.updateTerritory(territoryDialog.data.id, payload);
                toast.success("Territory updated successfully");
            } else {
                await geoAPI.createTerritory(payload);
                toast.success("Territory created successfully");
            }

            setTerritoryDialog({ open: false, mode: "create", data: null });
            loadData();
        } catch (err) {
            console.error("Failed to save territory:", err);
            toast.error(err.response?.data?.error || "Failed to save territory");
        } finally {
            setSavingTerritory(false);
        }
    };

    // ======================== DELETE HANDLERS ========================

    const openDeleteDialog = (type, item) => {
        setDeleteDialog({ open: true, type, item });
    };

    const handleDelete = async () => {
        const { type, item } = deleteDialog;
        try {
            if (type === "region") {
                await geoAPI.deleteRegion(item.id);
                if (selectedRegion?.id === item.id) {
                    setSelectedRegion(null);
                    setSelectedArea(null);
                }
                toast.success("Region deleted successfully");
            } else if (type === "area") {
                await geoAPI.deleteArea(item.id);
                if (selectedArea?.id === item.id) {
                    setSelectedArea(null);
                }
                toast.success("Area deleted successfully");
            } else if (type === "territory") {
                await geoAPI.deleteTerritory(item.id);
                toast.success("Territory deleted successfully");
            }

            setDeleteDialog({ open: false, type: null, item: null });
            loadData();
        } catch (err) {
            console.error("Failed to delete:", err);
            toast.error(err.response?.data?.error || `Failed to delete ${type}`);
        }
    };

    // ======================== SELECTION HANDLERS ========================

    const handleSelectRegion = (region) => {
        setSelectedRegion(region);
        setSelectedArea(null);
        setAreaSearch("");
        setTerritorySearch("");
    };

    const handleSelectArea = (area) => {
        setSelectedArea(area);
        setTerritorySearch("");
    };

    // ======================== STATS ========================

    const getRegionStats = (region) => {
        const regionAreas = areas.filter((a) => a.regionId === region.id);
        const regionTerritories = territories.filter((t) =>
            regionAreas.some((a) => a.id === t.areaId)
        );
        return { areas: regionAreas.length, territories: regionTerritories.length };
    };

    const getAreaStats = (area) => {
        return territories.filter((t) => t.areaId === area.id).length;
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
                title="Geography Management"
                subtitle="Manage your three-level geographic hierarchy: Regions → Areas → Territories"
                actions={[
                    <Button
                        key="refresh"
                        variant="outlined"
                        startIcon={<RefreshCw size={18} />}
                        onClick={loadData}
                    >
                        Refresh
                    </Button>,
                ]}
            />

            {/* Stats Bar */}
            <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
                <Chip
                    icon={<Globe size={16} />}
                    label={`${regions.length} Regions`}
                    color="primary"
                    variant="outlined"
                />
                <Chip
                    icon={<Map size={16} />}
                    label={`${areas.length} Areas`}
                    color="secondary"
                    variant="outlined"
                />
                <Chip
                    icon={<MapPin size={16} />}
                    label={`${territories.length} Territories`}
                    color="success"
                    variant="outlined"
                />
            </Box>

            {/* Three-Column Layout */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                    gap: 3,
                }}
            >
                {/* REGIONS COLUMN */}
                <Paper sx={{ p: 2, height: "fit-content", minHeight: 400 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Globe size={20} color="var(--color-primary)" />
                            <Typography variant="h6" fontWeight={600}>
                                Regions
                            </Typography>
                        </Box>
                        <Tooltip title="Add Region">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openRegionDialog("create")}
                                sx={{ bgcolor: "primary.light", "&:hover": { bgcolor: "primary.main", color: "#fff" } }}
                            >
                                <Plus size={18} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search regions..."
                        value={regionSearch}
                        onChange={(e) => setRegionSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                        }}
                        sx={{ mb: 2 }}
                    />

                    <List dense sx={{ maxHeight: 400, overflowY: "auto" }}>
                        {filteredRegions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                                {regions.length === 0 ? "No regions yet. Click + to add one." : "No matching regions."}
                            </Typography>
                        ) : (
                            filteredRegions.map((region) => {
                                const stats = getRegionStats(region);
                                const isSelected = selectedRegion?.id === region.id;
                                return (
                                    <ListItem
                                        key={region.id}
                                        button
                                        selected={isSelected}
                                        onClick={() => handleSelectRegion(region)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 0.5,
                                            border: isSelected ? "2px solid" : "1px solid transparent",
                                            borderColor: isSelected ? "primary.main" : "transparent",
                                            bgcolor: isSelected ? "primary.light" : "transparent",
                                            "&:hover": { bgcolor: isSelected ? "primary.light" : "action.hover" },
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {region.name || region.regionName}
                                                    {isSelected && <ChevronRight size={16} />}
                                                </Box>
                                            }
                                            secondary={`${stats.areas} areas, ${stats.territories} territories`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openRegionDialog("edit", region); }}>
                                                    <Edit2 size={14} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDeleteDialog("region", region); }}>
                                                    <Trash2 size={14} />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                </Paper>

                {/* AREAS COLUMN */}
                <Paper sx={{ p: 2, height: "fit-content", minHeight: 400, opacity: selectedRegion ? 1 : 0.6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Map size={20} color="var(--color-secondary)" />
                            <Typography variant="h6" fontWeight={600}>
                                Areas
                            </Typography>
                            {selectedRegion && (
                                <Chip size="small" label={selectedRegion.name || selectedRegion.regionName} color="primary" />
                            )}
                        </Box>
                        <Tooltip title={selectedRegion ? "Add Area" : "Select a region first"}>
                            <span>
                                <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => openAreaDialog("create")}
                                    disabled={!selectedRegion}
                                    sx={{ bgcolor: "secondary.light", "&:hover": { bgcolor: "secondary.main", color: "#fff" } }}
                                >
                                    <Plus size={18} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>

                    {!selectedRegion ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Select a region to view and manage its areas
                        </Alert>
                    ) : (
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search areas..."
                            value={areaSearch}
                            onChange={(e) => setAreaSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                            }}
                            sx={{ mb: 2 }}
                        />
                    )}

                    <List dense sx={{ maxHeight: 400, overflowY: "auto" }}>
                        {selectedRegion && filteredAreas.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                                {areas.filter((a) => a.regionId === selectedRegion.id).length === 0
                                    ? "No areas in this region. Click + to add one."
                                    : "No matching areas."}
                            </Typography>
                        ) : (
                            filteredAreas.map((area) => {
                                const territoryCount = getAreaStats(area);
                                const isSelected = selectedArea?.id === area.id;
                                return (
                                    <ListItem
                                        key={area.id}
                                        button
                                        selected={isSelected}
                                        onClick={() => handleSelectArea(area)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 0.5,
                                            border: isSelected ? "2px solid" : "1px solid transparent",
                                            borderColor: isSelected ? "secondary.main" : "transparent",
                                            bgcolor: isSelected ? "secondary.light" : "transparent",
                                            "&:hover": { bgcolor: isSelected ? "secondary.light" : "action.hover" },
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {area.name || area.areaName}
                                                    {isSelected && <ChevronRight size={16} />}
                                                </Box>
                                            }
                                            secondary={`${territoryCount} territories`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openAreaDialog("edit", area); }}>
                                                    <Edit2 size={14} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDeleteDialog("area", area); }}>
                                                    <Trash2 size={14} />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                </Paper>

                {/* TERRITORIES COLUMN */}
                <Paper sx={{ p: 2, height: "fit-content", minHeight: 400, opacity: selectedArea ? 1 : 0.6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MapPin size={20} color="var(--color-success)" />
                            <Typography variant="h6" fontWeight={600}>
                                Territories
                            </Typography>
                            {selectedArea && (
                                <Chip size="small" label={selectedArea.name || selectedArea.areaName} color="secondary" />
                            )}
                        </Box>
                        <Tooltip title={selectedArea ? "Add Territory" : "Select an area first"}>
                            <span>
                                <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => openTerritoryDialog("create")}
                                    disabled={!selectedArea}
                                    sx={{ bgcolor: "success.light", "&:hover": { bgcolor: "success.main", color: "#fff" } }}
                                >
                                    <Plus size={18} />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>

                    {!selectedArea ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Select an area to view and manage its territories
                        </Alert>
                    ) : (
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search territories..."
                            value={territorySearch}
                            onChange={(e) => setTerritorySearch(e.target.value)}
                            InputProps={{
                                startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                            }}
                            sx={{ mb: 2 }}
                        />
                    )}

                    <List dense sx={{ maxHeight: 400, overflowY: "auto" }}>
                        {selectedArea && filteredTerritories.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                                {territories.filter((t) => t.areaId === selectedArea.id).length === 0
                                    ? "No territories in this area. Click + to add one."
                                    : "No matching territories."}
                            </Typography>
                        ) : (
                            filteredTerritories.map((territory) => (
                                <ListItem
                                    key={territory.id}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        border: "1px solid transparent",
                                        "&:hover": { bgcolor: "action.hover" },
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Navigation size={14} />
                                                {territory.name || territory.territoryName}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => openTerritoryDialog("edit", territory)}>
                                                <Edit2 size={14} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" onClick={() => openDeleteDialog("territory", territory)}>
                                                <Trash2 size={14} />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))
                        )}
                    </List>
                </Paper>
            </Box>

            {/* ======================== REGION DIALOG ======================== */}
            <Dialog open={regionDialog.open} onClose={() => setRegionDialog({ open: false, mode: "create", data: null })} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {regionDialog.mode === "edit" ? "Edit Region" : "Create Region"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Region Name"
                        value={regionForm.name}
                        onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                        margin="normal"
                        required
                        autoFocus
                    />
                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Centroid Latitude (optional)"
                            value={regionForm.centroidLat}
                            onChange={(e) => setRegionForm({ ...regionForm, centroidLat: e.target.value })}
                            type="number"
                            inputProps={{ step: "any" }}
                        />
                        <TextField
                            fullWidth
                            label="Centroid Longitude (optional)"
                            value={regionForm.centroidLng}
                            onChange={(e) => setRegionForm({ ...regionForm, centroidLng: e.target.value })}
                            type="number"
                            inputProps={{ step: "any" }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRegionDialog({ open: false, mode: "create", data: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveRegion} variant="contained" disabled={savingRegion}>
                        {savingRegion ? <CircularProgress size={20} /> : regionDialog.mode === "edit" ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ======================== AREA DIALOG ======================== */}
            <Dialog open={areaDialog.open} onClose={() => setAreaDialog({ open: false, mode: "create", data: null })} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {areaDialog.mode === "edit" ? "Edit Area" : "Create Area"}
                </DialogTitle>
                <DialogContent>
                    {selectedRegion && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            This area will be created under region: <strong>{selectedRegion.name || selectedRegion.regionName}</strong>
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        label="Area Name"
                        value={areaForm.name}
                        onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                        margin="normal"
                        required
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAreaDialog({ open: false, mode: "create", data: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveArea} variant="contained" disabled={savingArea}>
                        {savingArea ? <CircularProgress size={20} /> : areaDialog.mode === "edit" ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ======================== TERRITORY DIALOG ======================== */}
            <Dialog open={territoryDialog.open} onClose={() => setTerritoryDialog({ open: false, mode: "create", data: null })} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {territoryDialog.mode === "edit" ? "Edit Territory" : "Create Territory"}
                </DialogTitle>
                <DialogContent>
                    {selectedArea && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            This territory will be created under area: <strong>{selectedArea.name || selectedArea.areaName}</strong>
                        </Alert>
                    )}
                    <TextField
                        fullWidth
                        label="Territory Name"
                        value={territoryForm.name}
                        onChange={(e) => setTerritoryForm({ ...territoryForm, name: e.target.value })}
                        margin="normal"
                        required
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTerritoryDialog({ open: false, mode: "create", data: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveTerritory} variant="contained" disabled={savingTerritory}>
                        {savingTerritory ? <CircularProgress size={20} /> : territoryDialog.mode === "edit" ? "Update" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ======================== DELETE CONFIRMATION DIALOG ======================== */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: null, item: null })}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the {deleteDialog.type}{" "}
                        <strong>"{deleteDialog.item?.name || deleteDialog.item?.regionName || deleteDialog.item?.areaName || deleteDialog.item?.territoryName}"</strong>?
                    </Typography>
                    {deleteDialog.type === "region" && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Deleting a region will also remove all its areas and territories!
                        </Alert>
                    )}
                    {deleteDialog.type === "area" && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            Deleting an area will also remove all its territories!
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, type: null, item: null })}>
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
