import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
    Alert,
    Tooltip,
    Paper,
    Divider,
    Fade,
    Stack
} from '@mui/material';
import {
    Package,
    Truck,
    Barcode,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    RefreshCw,
    Search,
    ChevronRight,
    Plus,
    Minus
} from 'lucide-react';
import { goodsReceiptAPI, barcodeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import BarcodeScanner from '../../components/BarcodeScanner';

const GoodsReceived = () => {
    const [pendingShipments, setPendingShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [isScanningMode, setIsScanningMode] = useState(false);
    const [receivedItems, setReceivedItems] = useState([]); // Array of { materialId, materialName, expectedQty, receivedQty }
    const [scanModalOpen, setScanModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPendingShipments();
    }, []);

    const fetchPendingShipments = async () => {
        setLoading(true);
        try {
            const res = await goodsReceiptAPI.getPending();
            const shipments = Array.isArray(res) ? res : (res.data || res.shipments || []);
            setPendingShipments(shipments);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load pending shipments");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectShipment = (shipment) => {
        setSelectedShipment(shipment);
        // Initialize received items based on shipment items
        const items = (shipment.items || []).map(item => ({
            materialId: item.materialId,
            materialName: item.materialName || item.material?.name || 'Unknown Item',
            expectedQty: item.qty || item.shippedQty || item.quantity || 0,
            receivedQty: 0,
            barcode: item.barcode || item.material?.barcode
        }));
        setReceivedItems(items);
        setIsScanningMode(false);
    };

    const handleUpdateQty = (materialId, delta) => {
        setReceivedItems(prev => prev.map(item => {
            if (item.materialId === materialId) {
                const newQty = Math.max(0, Math.min(item.expectedQty, item.receivedQty + delta));
                return { ...item, receivedQty: newQty };
            }
            return item;
        }));
    };

    const onScanSuccess = (decodedText) => {
        // Try to match barcode with expected items
        const matchingItemIndex = receivedItems.findIndex(item => item.barcode === decodedText);

        if (matchingItemIndex !== -1) {
            const item = receivedItems[matchingItemIndex];
            if (item.receivedQty < item.expectedQty) {
                handleUpdateQty(item.materialId, 1);
                toast.info(`Scanned: ${item.materialName}`);
            } else {
                toast.warning(`Quantity for ${item.materialName} already reached expected limit.`);
            }
        } else {
            toast.error(`Unrecognized barcode: ${decodedText}`);
        }
    };

    const handleSubmitReceipt = async () => {
        setSubmitting(true);
        try {
            const payload = {
                orderId: selectedShipment.id,
                items: receivedItems.map(item => ({
                    materialId: item.materialId,
                    receivedQty: item.receivedQty
                }))
            };

            await goodsReceiptAPI.postReceipt(payload);
            toast.success("Goods Receipt posted successfully!");
            setSelectedShipment(null);
            fetchPendingShipments();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || "Failed to post goods receipt";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const totalExpected = receivedItems.reduce((acc, curr) => acc + curr.expectedQty, 0);
    const totalReceived = receivedItems.reduce((acc, curr) => acc + curr.receivedQty, 0);
    const progress = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

    if (loading && !pendingShipments.length) {
        return <Box sx={{ p: 4 }}><LinearProgress /></Box>;
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Goods Received</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Process incoming shipments from the warehouse
                    </Typography>
                </Box>
                <Button
                    startIcon={<RefreshCw size={18} />}
                    variant="outlined"
                    onClick={fetchPendingShipments}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Side: Pending Shipments List */}
                <Grid item xs={12} lg={selectedShipment ? 4 : 12}>
                    <Card variant="outlined">
                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                                <Truck size={20} />
                                Pending Shipments
                            </Typography>
                            <Chip label={pendingShipments.length} size="small" color="primary" />
                        </Box>
                        <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {pendingShipments.length > 0 ? (
                                <Stack divider={<Divider />}>
                                    {pendingShipments.map((shipment) => (
                                        <Box
                                            key={shipment.id}
                                            onClick={() => handleSelectShipment(shipment)}
                                            sx={{
                                                p: 2,
                                                cursor: 'pointer',
                                                transition: '0.2s',
                                                bgcolor: selectedShipment?.id === shipment.id ? 'primary.soft' : 'transparent',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography fontWeight="bold">#{shipment.orderNumber || shipment.id.slice(0, 8)}</Typography>
                                                <Chip
                                                    label={shipment.status || 'Shipped'}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                                    <Package size={12} />
                                                    {shipment.items?.length || 0} Items
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {shipment.shippedDate || 'Today'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" color="primary" fontWeight="500">
                                                    {shipment.warehouseName || 'Main Warehouse'}
                                                </Typography>
                                                <ChevronRight size={16} className="text-muted" />
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">No pending shipments found.</Typography>
                                </Box>
                            )}
                        </Box>
                    </Card>
                </Grid>

                {/* Right Side: Shipment Detail & Processing */}
                {selectedShipment && (
                    <Grid item xs={12} lg={8}>
                        <Fade in={!!selectedShipment}>
                            <Box>
                                <Card variant="outlined" sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Box>
                                                <Typography variant="h5" fontWeight="bold">Shipment #{selectedShipment.orderNumber || selectedShipment.id.slice(0, 8)}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    From: {selectedShipment.warehouseName || 'Regional Warehouse'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="subtitle2">Items Received</Typography>
                                                <Typography variant="h6" color="primary">{totalReceived} / {totalExpected}</Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ mb: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Verification Progress</Typography>
                                                <Typography variant="body2" fontWeight="bold">{Math.round(progress)}%</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<Barcode size={20} />}
                                                onClick={() => setScanModalOpen(true)}
                                                color="primary"
                                                sx={{ px: 4 }}
                                            >
                                                Start Scanning
                                            </Button>
                                            <Button
                                                variant="soft"
                                                onClick={() => setIsScanningMode(!isScanningMode)}
                                                color={isScanningMode ? "warning" : "inherit"}
                                            >
                                                {isScanningMode ? "Disable Manual" : "Enable Manual Entry"}
                                            </Button>
                                        </Box>

                                        <Table size="medium">
                                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Material</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Expected</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Received</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {receivedItems.map((item) => (
                                                    <TableRow key={item.materialId} sx={{ '&:last-child td': { border: 0 } }}>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="600">{item.materialName}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{item.barcode || 'No barcode'}</Typography>
                                                        </TableCell>
                                                        <TableCell align="center">{item.expectedQty}</TableCell>
                                                        <TableCell align="center">
                                                            {isScanningMode ? (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                                    <IconButton size="small" onClick={() => handleUpdateQty(item.materialId, -1)} disabled={item.receivedQty <= 0}>
                                                                        <Minus size={16} />
                                                                    </IconButton>
                                                                    <Typography variant="body2" sx={{ width: 30, textAlign: 'center' }}>{item.receivedQty}</Typography>
                                                                    <IconButton size="small" onClick={() => handleUpdateQty(item.materialId, 1)} disabled={item.receivedQty >= item.expectedQty}>
                                                                        <Plus size={16} />
                                                                    </IconButton>
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="h6" color={item.receivedQty === item.expectedQty ? "success.main" : "text.secondary"}>
                                                                    {item.receivedQty}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {item.receivedQty === item.expectedQty ? (
                                                                <Chip label="Matched" size="small" color="success" icon={<CheckCircle2 size={12} />} />
                                                            ) : item.receivedQty > 0 ? (
                                                                <Chip label="Partial" size="small" color="warning" />
                                                            ) : (
                                                                <Chip label="Pending" size="small" variant="outlined" />
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                    <Divider />
                                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'action.hover' }}>
                                        <Button variant="outlined" color="inherit" onClick={() => setSelectedShipment(null)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            disabled={totalReceived === 0 || submitting}
                                            onClick={handleSubmitReceipt}
                                            startIcon={<CheckCircle2 size={18} />}
                                        >
                                            {submitting ? "Processing..." : "Confirm & Post Receipt"}
                                        </Button>
                                    </Box>
                                </Card>

                                {totalReceived < totalExpected && totalReceived > 0 && (
                                    <Alert severity="warning" variant="outlined" icon={<AlertTriangle />}>
                                        Partial Receipt: You are receiving {totalReceived} out of {totalExpected} items. Please verify if items were missing from the shipment.
                                    </Alert>
                                )}
                            </Box>
                        </Fade>
                    </Grid>
                )}
            </Grid>

            {/* Barcode Scanner Modal */}
            <Dialog
                open={scanModalOpen}
                onClose={() => setScanModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Scan Shipment Items
                    <IconButton onClick={() => setScanModalOpen(false)}>
                        <Box component="span" sx={{ fontSize: 24 }}>&times;</Box>
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Currently verifying: {selectedShipment?.orderNumber || selectedShipment?.id.slice(0, 8)}
                        </Typography>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                    <Box sx={{ width: '100%', minHeight: 400, bgcolor: 'black', borderRadius: 2, overflow: 'hidden' }}>
                        <BarcodeScanner onScanSuccess={onScanSuccess} />
                    </Box>
                    <Box sx={{ mt: 3, maxHeight: 200, overflowY: 'auto' }}>
                        <Typography variant="subtitle2" gutterBottom>Scanned Progress</Typography>
                        <Stack spacing={1}>
                            {receivedItems.filter(i => i.receivedQty > 0).map(item => (
                                <Box key={item.materialId} sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                    <Typography variant="body2">{item.materialName}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{item.receivedQty} / {item.expectedQty}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScanModalOpen(false)} variant="contained" fullWidth>
                        Finish Scanning
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GoodsReceived;
