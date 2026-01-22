import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Divider,
    Alert
} from '@mui/material';
import {
    CheckCircle2,
    XCircle,
    Eye,
    Package,
    Calendar,
    FileText,
    Truck,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { goodsReceiptAPI } from '../../services/api';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';

const SalesGRApprovals = () => {
    const [pendingGRs, setPendingGRs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGR, setSelectedGR] = useState(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPendingGRs();
    }, []);

    const fetchPendingGRs = async () => {
        setLoading(true);
        try {
            const res = await goodsReceiptAPI.getPending();
            // Backend returns { success: true, data: [...] }
            setPendingGRs(res.data || []);
        } catch (err) {
            console.error("Failed to load GRs", err);
            toast.error("Failed to load pending approvals");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (gr) => {
        setSelectedGR(gr);
    };

    const handleCloseDetails = () => {
        setSelectedGR(null);
        setRejectDialogOpen(false);
        setRejectReason("");
    };

    const handleApprove = async () => {
        if (!selectedGR) return;
        if (!window.confirm(`Are you sure you want to approve GR #${selectedGR.receiptNumber}? This will generate an invoice.`)) return;

        setProcessing(true);
        try {
            await goodsReceiptAPI.approve(selectedGR.id);
            toast.success(`Goods Receipt ${selectedGR.receiptNumber} Approved`);
            handleCloseDetails();
            fetchPendingGRs();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Approval failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.warning("Please enter a reason for rejection");
            return;
        }

        setProcessing(true);
        try {
            await goodsReceiptAPI.reject(selectedGR.id, rejectReason);
            toast.success(`Goods Receipt ${selectedGR.receiptNumber} Rejected`);
            handleCloseDetails();
            fetchPendingGRs();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Rejection failed");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Goods Receipt Approvals"
                subtitle="Review and approve goods receipts submitted by your dealers."
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<RefreshCw size={18} />} onClick={fetchPendingGRs} disabled={loading}>
                    Refresh List
                </Button>
            </Box>

            <Card variant="outlined">
                {pendingGRs.length === 0 && !loading ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No pending approvals found.</Typography>
                    </Box>
                ) : (
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell>GR Number</TableCell>
                                <TableCell>Dealer</TableCell>
                                <TableCell>Order Ref</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Items</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pendingGRs.map((gr) => (
                                <TableRow key={gr.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{gr.receiptNumber}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {/* Ideally getting dealer name, falling back to ID if populate missing */}
                                        {gr.dealerId}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FileText size={14} className="text-muted" />
                                            {/* Order number or ID */}
                                            {gr.order?.orderNumber || gr.orderId?.slice(0, 8)}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Calendar size={14} className="text-muted" />
                                            {new Date(gr.createdAt).toLocaleDateString()}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            {gr.receivedItems?.length || 0} items received
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<Eye size={16} />}
                                            onClick={() => handleViewDetails(gr)}
                                        >
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* DETAIL MODAL */}
            <Dialog open={!!selectedGR} onClose={handleCloseDetails} maxWidth="md" fullWidth>
                {selectedGR && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Review Goods Receipt: {selectedGR.receiptNumber}</span>
                            <Chip label="Pending Approval" color="warning" size="small" />
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>ORDER DETAILS</Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2"><strong>Order ID:</strong> {selectedGR.order?.orderNumber || selectedGR.orderId}</Typography>
                                        <Typography variant="body2"><strong>Dealer ID:</strong> {selectedGR.dealerId}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2"><strong>Submitted:</strong> {new Date(selectedGR.createdAt).toLocaleString()}</Typography>
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>RECEIVED ITEMS</Typography>
                            <Table size="small" sx={{ mb: 3 }}>
                                <TableHead component={Paper} elevation={0} sx={{ bgcolor: 'background.neutral' }}>
                                    <TableRow>
                                        <TableCell>Material</TableCell>
                                        <TableCell align="center">Expected (Shipped)</TableCell>
                                        <TableCell align="center">Received (Confirmed)</TableCell>
                                        <TableCell align="right">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedGR.receivedItems?.map((item, idx) => {
                                        // Try to find matching item in order to compare qty
                                        const orderItem = selectedGR.order?.items?.find(oi => oi.materialId === item.materialId);
                                        const expected = orderItem ? (orderItem.shippedQty || orderItem.quantity) : '?';
                                        const isMismatch = expected !== '?' && item.quantity !== expected;

                                        return (
                                            <TableRow key={idx}>
                                                <TableCell>{item.materialName || item.materialId}</TableCell>
                                                <TableCell align="center">{expected}</TableCell>
                                                <TableCell align="center">
                                                    <Typography fontWeight="bold" color={isMismatch ? "error" : "inherit"}>
                                                        {item.quantity || item.receivedQty}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {isMismatch ? (
                                                        <Chip label="Mismatch" size="small" color="error" variant="outlined" />
                                                    ) : (
                                                        <Chip label="Match" size="small" color="success" variant="outlined" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            {selectedGR.remarks && (
                                <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, mb: 1 }}>
                                    <Typography variant="caption" fontWeight="bold">DEALER REMARKS:</Typography>
                                    <Typography variant="body2">{selectedGR.remarks}</Typography>
                                </Box>
                            )}

                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={handleCloseDetails} color="inherit">Cancel</Button>
                            <Button
                                onClick={() => setRejectDialogOpen(true)}
                                color="error"
                                variant="outlined"
                                disabled={processing}
                                startIcon={<XCircle size={18} />}
                            >
                                Reject
                            </Button>
                            <Button
                                onClick={handleApprove}
                                color="primary"
                                variant="contained"
                                disabled={processing}
                                startIcon={<CheckCircle2 size={18} />}
                            >
                                Approve & Generate Invoice
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* REJECT CONFIRMATION */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
                <DialogTitle>Reject Goods Receipt</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Please provide a reason for rejecting this Goods Receipt. The dealer will be notified.
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Rejection Reason"
                        fullWidth
                        multiline
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleReject} color="error" variant="contained">
                        Confirm Rejection
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Simple Paper component wrapper for TableHead to fix error if not imported
const Paper = (props) => <Box {...props} />;

export default SalesGRApprovals;
