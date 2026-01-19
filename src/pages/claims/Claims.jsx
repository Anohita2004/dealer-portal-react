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
    IconButton
} from "@mui/material";
import { Plus, Download, FileText, Upload, UploadCloud } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { toast } from "react-toastify";

// Mock Data
const MOCK_CLAIMS = [
    { id: "CLM-001", deliveryId: "DEL-1001", material: "MAT-101", qty: 5, reason: "Damaged In Transit", status: "Approved" },
    { id: "CLM-002", deliveryId: "DEL-1003", material: "MAT-105", qty: 2, reason: "Short Supply", status: "Draft" },
    { id: "CLM-003", deliveryId: "DEL-1002", material: "MAT-102", qty: 10, reason: "Wrong Material", status: "Submitted" }
];

const REASONS = [
    { key: "DAMAGED_IN_TRANSIT", label: "Damaged In Transit" },
    { key: "SHORT_SUPPLY", label: "Short Supply" },
    { key: "WRONG_MATERIAL", label: "Wrong Material" },
    { key: "OTHER", label: "Other" }
];

export default function Claims() {
    const [claims, setClaims] = useState(MOCK_CLAIMS);
    const [createOpen, setCreateOpen] = useState(false);

    // Create Form State
    const [formData, setFormData] = useState({
        deliveryId: "",
        material: "",
        qty: "",
        reason: "",
        description: "",
        file: null
    });

    const columns = [
        { field: "id", headerName: "Claim ID" },
        { field: "deliveryId", headerName: "Delivery ID" },
        { field: "material", headerName: "Material" },
        { field: "qty", headerName: "Qty" },
        { field: "reason", headerName: "Reason" },
        {
            field: "status",
            headerName: "Status",
            renderCell: ({ value }) => {
                let color = "default";
                if (value === "Approved") color = "success";
                if (value === "Submitted") color = "warning";
                if (value === "Rejected") color = "error";
                return <Chip label={value} color={color} size="small" variant="outlined" />;
            }
        },
        {
            field: "actions",
            headerName: "Actions",
            renderCell: ({ row }) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {row.status === "Draft" && (
                        <IconButton size="small" onClick={() => handleSubmitSAP(row.id)} color="primary" title="Submit to SAP">
                            <Upload size={16} />
                        </IconButton>
                    )}
                </Box>
            )
        }
    ];

    const handleCreateSubmit = () => {
        const newClaim = {
            id: `CLM-00${claims.length + 1}`,
            deliveryId: formData.deliveryId,
            material: formData.material,
            qty: formData.qty,
            reason: REASONS.find(r => r.key === formData.reason)?.label || formData.reason,
            status: "Draft"
        };
        setClaims([...claims, newClaim]);
        setCreateOpen(false);
        toast.success("Claim Created Successfully!");
    };

    const handleSubmitSAP = (id) => {
        const updated = claims.map(c => c.id === id ? { ...c, status: "Submitted" } : c);
        setClaims(updated);
        toast.success(`Claim ${id} submitted to SAP!`);
    };

    const handleDownloadReport = () => {
        // Mock download
        window.open("/api/claims/report", "_blank"); // As per previous request for window.open
        toast.info("Downloading Report...");
    };

    return (
        <Box p={3}>
            <PageHeader
                title="Insurance Claims"
                subtitle="Manage claims for damages and shortages"
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" startIcon={<Download size={18} />} onClick={handleDownloadReport}>
                            Download Report
                        </Button>
                        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
                            New Claim
                        </Button>
                    </Box>
                }
            />

            <DataTable
                columns={columns}
                rows={claims}
                loading={false}
            />

            {/* CREATE DIALOG */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Insurance Claim</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Delivery Order ID"
                            fullWidth
                            value={formData.deliveryId}
                            onChange={(e) => setFormData({ ...formData, deliveryId: e.target.value })}
                        />
                        <TextField
                            label="Material Code"
                            fullWidth
                            value={formData.material}
                            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                        />
                        <TextField
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={formData.qty}
                            onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                        />
                        <TextField
                            select
                            label="Reason"
                            fullWidth
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        >
                            {REASONS.map((opt) => (
                                <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Description"
                            multiline
                            rows={3}
                            fullWidth
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />

                        {/* Simple File Input */}
                        <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
                            <input
                                accept="image/*,.pdf"
                                style={{ display: 'none' }}
                                id="raised-button-file"
                                multiple
                                type="file"
                                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                            />
                            <label htmlFor="raised-button-file">
                                <Button variant="outlined" component="span" startIcon={<UploadCloud size={16} />}>
                                    Upload Evidence
                                </Button>
                            </label>
                            {formData.file && <Typography variant="caption" display="block" mt={1}>{formData.file.name}</Typography>}
                        </Box>

                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateSubmit}>Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
