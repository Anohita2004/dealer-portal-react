import React, { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton
} from "@mui/material";
import { Plus, Ruler, UploadCloud, CheckCircle, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { toast } from "react-toastify";

// Mock Data
const MOCK_SESSIONS = [
    { id: 101, description: "Q1 Cement Count", plant: "1001", status: "In Progress", date: "2025-10-30" },
    { id: 102, description: "Annual Audit", plant: "1002", status: "Planned", date: "2025-11-15" },
    { id: 103, description: "Ad-hoc Check", plant: "1001", status: "Review", date: "2025-10-20" }
];

const MASTER_DATA = {
    plants: [
        { key: "1001", label: "1001 - Hamburg Plant" },
        { key: "1002", label: "1002 - Berlin Plant" }
    ],
    storageLocations: [
        { key: "FG01", label: "FG01 - Finished Goods" },
        { key: "RM01", label: "RM01 - Raw Materials" }
    ]
};

const MOCK_ITEMS = [
    { id: 1, material: "MAT-101", description: "Cement 50kg", batch: "BATCH-X", bookQty: 500, physicalQty: 500 },
    { id: 2, material: "MAT-102", description: "Sand 1T", batch: "BATCH-Y", bookQty: 200, physicalQty: 195 },
    { id: 3, material: "MAT-103", description: "Bricks Pallet", batch: "BATCH-Z", bookQty: 50, physicalQty: 50 },
];

export default function PhysicalInventory() {
    const [sessions, setSessions] = useState(MOCK_SESSIONS);
    const [createOpen, setCreateOpen] = useState(false);
    const [countOpen, setCountOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    // Create Form State
    const [formData, setFormData] = useState({
        plant: "",
        storageLocation: "",
        description: "",
        date: ""
    });

    // Count Sheet State
    const [countItems, setCountItems] = useState(MOCK_ITEMS);

    const columns = [
        { field: "id", headerName: "ID" },
        { field: "description", headerName: "Description" },
        { field: "plant", headerName: "Plant" },
        { field: "date", headerName: "Date" },
        {
            field: "status",
            headerName: "Status",
            renderCell: ({ value }) => {
                let color = "default";
                if (value === "In Progress") color = "warning";
                if (value === "Review") color = "error";
                if (value === "Posted") color = "success";
                return <Chip label={value} color={color} size="small" variant="outlined" />;
            }
        },
        {
            field: "actions",
            headerName: "Actions",
            renderCell: ({ row }) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleOpenCount(row)} color="primary" title="Enter Counts">
                        <Ruler size={16} />
                    </IconButton>
                </Box>
            )
        }
    ];

    const handleCreateSubmit = () => {
        const newSession = {
            id: sessions.length + 101,
            ...formData,
            status: "Planned"
        };
        setSessions([...sessions, newSession]);
        setCreateOpen(false);
        toast.success("Inventory Session Initiated!");
    };

    const handleOpenCount = (session) => {
        setSelectedSession(session);
        setCountOpen(true);
    };

    const handleQtyChange = (id, val) => {
        const updated = countItems.map(item =>
            item.id === id ? { ...item, physicalQty: val } : item
        );
        setCountItems(updated);
    };

    const handleCountSubmit = () => {
        setCountOpen(false);
        toast.success("Counts Submitted Successfully!");
    };

    return (
        <Box p={3}>
            <PageHeader
                title="Physical Inventory"
                subtitle="Manage stock counting sessions and variances"
                action={
                    <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
                        Initiate Count
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                rows={sessions}
                loading={false}
            />

            {/* INITIATE DIALOG */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Initiate Inventory Count</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Description"
                            fullWidth
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <TextField
                            select
                            label="Plant"
                            fullWidth
                            value={formData.plant}
                            onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                        >
                            {MASTER_DATA.plants.map((opt) => (
                                <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Storage Location"
                            fullWidth
                            value={formData.storageLocation}
                            onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                        >
                            {MASTER_DATA.storageLocations.map((opt) => (
                                <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Planned Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateSubmit}>Initiate</Button>
                </DialogActions>
            </Dialog>

            {/* COUNTING SHEET DIALOG */}
            <Dialog open={countOpen} onClose={() => setCountOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Counting Sheet: {selectedSession?.description}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Material</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Batch</TableCell>
                                        <TableCell align="right">Book Qty</TableCell>
                                        <TableCell align="right" sx={{ width: 120 }}>Physical Qty</TableCell>
                                        <TableCell align="right">Variance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {countItems.map((item) => {
                                        const variance = (Number(item.physicalQty) || 0) - item.bookQty;
                                        const isVariance = variance !== 0;
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.material}</TableCell>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell>{item.batch}</TableCell>
                                                <TableCell align="right">{item.bookQty}</TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        value={item.physicalQty}
                                                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                                        inputProps={{ style: { textAlign: 'right' } }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        variant="body2"
                                                        color={isVariance ? "error" : "text.secondary"}
                                                        fontWeight={isVariance ? "bold" : "regular"}
                                                    >
                                                        {variance > 0 ? `+${variance}` : variance}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCountOpen(false)}>Save Draft</Button>
                    <Button variant="contained" onClick={handleCountSubmit} color="primary">Submit Counts</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
