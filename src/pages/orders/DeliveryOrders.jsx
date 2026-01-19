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

    const [pendingOrders, setPendingOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [storageLocations, setStorageLocations] = useState([]);

    useEffect(() => {
        if (createOpen) {
            setLoadingOrders(true);
            // Use dynamic import for code splitting or better dependency management
            import("../../services/api").then((module) => {
                const { orderAPI, warehouseAPI } = module;

                // Fetch Orders
                orderAPI.getAllOrders({ limit: 100 }) // Fetch more to ensure we find approved ones
                    .then(res => {
                        // Handle both array and paginated response
                        const list = Array.isArray(res) ? res : res.orders || res.data || [];
                        const trainable = list.filter(o => {
                            const s = (o.status || "").toLowerCase();
                            const w = (o.approvalStatus || "").toLowerCase();
                            // Show orders that are approved/confirmed and ready for delivery
                            return (s === 'approved' || s === 'confirmed' || w === 'approved') && s !== 'delivered';
                        });
                        setPendingOrders(trainable.length > 0 ? trainable : []);
                    })
                    .catch(err => {
                        console.error("Failed to load orders:", err);
                        toast.error("Could not load sales orders");
                    })
                    .finally(() => setLoadingOrders(false));

                // Fetch Storage Locations / Warehouses
                warehouseAPI.getAll()
                    .then(res => {
                        const list = Array.isArray(res) ? res : res.warehouses || res.data || [];
                        setStorageLocations(list.length > 0 ? list : MASTER_DATA.storageLocations);
                    })
                    .catch(() => {
                        setStorageLocations(MASTER_DATA.storageLocations);
                    });
            });
        }
    }, [createOpen]);

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
                actions={
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
                            select
                            label="Select Sales Order"
                            fullWidth
                            value={formData.salesOrder}
                            onChange={(e) => setFormData({ ...formData, salesOrder: e.target.value })}
                            helperText="Only approved orders pending delivery are shown"
                        >
                            {loadingOrders ? (
                                <MenuItem disabled>Loading orders...</MenuItem>
                            ) : pendingOrders.length === 0 ? (
                                <MenuItem disabled>No pending approved orders found</MenuItem>
                            ) : (
                                pendingOrders.map((order) => (
                                    <MenuItem key={order.orderNumber || order.id} value={order.orderNumber || order.orderId || `SO-${order.id}`}>
                                        {order.orderNumber || `SO-${order.id}`} — {order.dealerName || "Unknown Dealer"} ({order.items?.length || 0} items)
                                    </MenuItem>
                                ))
                            )}
                        </TextField>
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
                            {storageLocations.length === 0 ? (
                                <MenuItem disabled>Loading locations...</MenuItem>
                            ) : (
                                storageLocations.map((opt) => (
                                    <MenuItem key={opt.id || opt.key} value={opt.code || opt.id || opt.key}>
                                        {opt.name || opt.label || opt.code || opt.key}
                                    </MenuItem>
                                ))
                            )}
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
