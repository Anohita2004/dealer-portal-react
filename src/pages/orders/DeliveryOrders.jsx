import React, { useState, useEffect } from "react";
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
    Grid,
    Typography,
    IconButton
} from "@mui/material";
import { Plus, Calendar, CheckCircle, Clock, FileText, Truck } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import { toast } from "react-toastify";

// Mock Data
const MOCK_DELIVERIES = [
    { id: 1, deliveryNo: "DEL-1001", salesOrder: "SO-5001", date: "2025-10-25", status: "Allocated", loadingPoint: "LP01" },
    { id: 2, deliveryNo: "DEL-1002", salesOrder: "SO-5005", date: "2025-10-26", status: "Draft", loadingPoint: "" },
    { id: 3, deliveryNo: "DEL-1003", salesOrder: "SO-5010", date: "2025-10-27", status: "PGI", loadingPoint: "LP02" }
];

const MASTER_DATA = {
    storageLocations: [
        { key: "SL01", label: "SL01 - Main Warehouse" },
        { key: "SL02", label: "SL02 - Returns" }
    ],
    loadingPoints: [
        { key: "LP01", label: "North Gate" },
        { key: "LP02", label: "South Gate" }
    ]
};

export default function DeliveryOrders() {
    const [deliveries, setDeliveries] = useState(MOCK_DELIVERIES);
    const [createOpen, setCreateOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    // Create Form State
    const [formData, setFormData] = useState({
        salesOrder: "",
        deliveryDate: "",
        storageLocation: "",
        loadingPoint: ""
    });

    // Schedule Form State
    const [scheduleData, setScheduleData] = useState({
        vehicleNo: "",
        driverName: "",
        startTime: "",
        endTime: "",
        loadingPoint: ""
    });

    const columns = [
        { field: "deliveryNo", headerName: "Delivery No" },
        { field: "salesOrder", headerName: "Sales Order" },
        { field: "date", headerName: "Date" },
        {
            field: "status",
            headerName: "Status",
            renderCell: ({ value }) => {
                let color = "default";
                if (value === "PGI") color = "success";
                if (value === "Allocated") color = "info";
                if (value === "Draft") color = "default";
                return <Chip label={value} color={color} size="small" variant="outlined" />;
            }
        },
        {
            field: "actions",
            headerName: "Actions",
            renderCell: ({ row }) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleOpenSchedule(row)} color="primary" title="Schedule Dock">
                        <Calendar size={16} />
                    </IconButton>
                </Box>
            )
        }
    ];

    const handleCreateSubmit = () => {
        const newOrder = {
            id: deliveries.length + 1,
            deliveryNo: `DEL-100${deliveries.length + 1}`,
            salesOrder: formData.salesOrder,
            date: formData.deliveryDate,
            status: "Draft",
            loadingPoint: formData.loadingPoint
        };
        setDeliveries([...deliveries, newOrder]);
        setCreateOpen(false);
        toast.success("Delivery Order Created!");
    };

    const handleOpenSchedule = (delivery) => {
        setSelectedDelivery(delivery);
        setScheduleData({ ...scheduleData, loadingPoint: delivery.loadingPoint || "" });
        setScheduleOpen(true);
    };

    const handleScheduleSubmit = () => {
        const updated = deliveries.map(d =>
            d.id === selectedDelivery.id ? { ...d, status: "Scheduled", loadingPoint: scheduleData.loadingPoint } : d
        );
        setDeliveries(updated);
        setScheduleOpen(false);
        toast.success("Dock Scheduled Successfully!");
    };

    return (
        <Box p={3}>
            <PageHeader
                title="Delivery Order Management"
                subtitle="Manage outbound shipments and dock scheduling"
                action={
                    <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
                        Create Delivery
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                rows={deliveries}
                loading={false}
            />

            {/* CREATE DIALOG */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create Delivery Order</DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Sales Order Number"
                            fullWidth
                            value={formData.salesOrder}
                            onChange={(e) => setFormData({ ...formData, salesOrder: e.target.value })}
                        />
                        <TextField
                            label="Delivery Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.deliveryDate}
                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        />
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
                            select
                            label="Loading Point"
                            fullWidth
                            value={formData.loadingPoint}
                            onChange={(e) => setFormData({ ...formData, loadingPoint: e.target.value })}
                        >
                            {MASTER_DATA.loadingPoints.map((opt) => (
                                <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateSubmit}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* SCHEDULE DIALOG */}
            <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Schedule Dock</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Scheduling for Delivery: {selectedDelivery?.deliveryNo}
                        </Typography>
                        <TextField
                            select
                            label="Loading Point"
                            fullWidth
                            value={scheduleData.loadingPoint}
                            onChange={(e) => setScheduleData({ ...scheduleData, loadingPoint: e.target.value })}
                        >
                            {MASTER_DATA.loadingPoints.map((opt) => (
                                <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                            ))}
                        </TextField>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Start Time"
                                    type="datetime-local"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={scheduleData.startTime}
                                    onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="End Time"
                                    type="datetime-local"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={scheduleData.endTime}
                                    onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleScheduleSubmit}>Schedule</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
