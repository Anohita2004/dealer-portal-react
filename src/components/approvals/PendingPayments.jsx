import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import { Info } from "lucide-react";
import { paymentAPI } from "../../services/api";
import PaymentApprovalCard from "../PaymentApprovalCard";
import { useAuth } from "../../context/AuthContext";
import BulkActionBar from "../BulkActionBar";
import { toast } from "react-toastify";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel } from "@mui/material";

export default function PendingPayments() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
    const [bulkRejectReason, setBulkRejectReason] = useState("");
    const [bulkRemarks, setBulkRemarks] = useState("");
    const role = user?.role?.toLowerCase();

    const fetchPayments = async () => {
        try {
            setLoading(true);
            let res;

            if (role === "dealer_admin") {
                res = await paymentAPI.getDealerPending();
            } else {
                // managers and finance roles
                res = await paymentAPI.getFinancePending();
            }

            let list = Array.isArray(res) ? res : res.pending || res.payments || res.data || res || [];

            // Filter by workflow stage for manager roles
            const managerRoles = ["territory_manager", "area_manager", "regional_manager", "regional_admin"];
            if (managerRoles.includes(role)) {
                const filtered = [];
                for (const payment of list) {
                    try {
                        const workflowRes = await paymentAPI.getWorkflowStatus(payment.id);
                        const pipeline = ["dealer_admin", "sales_executive", "territory_manager", "area_manager", "regional_manager", "regional_admin"];
                        const workflow = workflowRes.workflow || workflowRes.data || workflowRes;
                        const currentStage = workflow?.currentStage;

                        // Normalize strings for comparison
                        const normalize = (str) => String(str || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
                        const normRole = normalize(role);
                        const normStage = normalize(currentStage);

                        // Check if current stage matches user role, or if user is at the correct StageX index
                        let isUserTurn = normRole === normStage;
                        if (!isUserTurn && normStage.startsWith("stage")) {
                            const stageNum = parseInt(normStage.replace(/\D/g, ''), 10);
                            const mappedRole = !isNaN(stageNum) && stageNum > 0 ? pipeline[stageNum - 1] : null;
                            isUserTurn = normalize(mappedRole) === normRole;
                        }

                        if ((isUserTurn || normRole === "superadmin") && (workflow?.approvalStatus || "pending").toLowerCase() === "pending") {
                            filtered.push(payment);
                        }
                    } catch (err) {
                        // fallback
                        if ((payment.status || "").toLowerCase() === "pending" || (payment.approvalStatus || "").toLowerCase() === "pending") {
                            filtered.push(payment);
                        }
                    }
                }
                list = filtered;
            } else {
                // general filter for pending
                list = list.filter(p => {
                    const s = (p.status || "").toLowerCase();
                    const as = (p.approvalStatus || "").toLowerCase();
                    return s === "pending" || as === "pending";
                });
            }

            setPayments(list);
            setSelectedIds([]);
        } catch (error) {
            console.error("Failed to fetch pending payments:", error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedIds(payments.map((p) => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleBulkApprove = async () => {
        const remarks = window.prompt("Enter approval remarks (optional):", "Bulk approved from dashboard");
        if (remarks === null) return;

        setBulkLoading(true);
        try {
            const res = await paymentAPI.bulkApprove(selectedIds, remarks);
            const { success, failed } = res.results || { success: selectedIds, failed: [] };

            if (failed.length > 0) {
                toast.warning(`Approved ${success.length} items, but ${failed.length} failed.`);
            } else {
                toast.success(`Successfully approved ${success.length} items.`);
            }

            fetchPayments();
        } catch (err) {
            console.error("Bulk approval failed:", err);
            toast.error(err.response?.data?.error || "Bulk approval failed");
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkReject = () => {
        setBulkRejectOpen(true);
    };

    const submitBulkReject = async () => {
        if (!bulkRejectReason) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setBulkLoading(true);
        try {
            const res = await paymentAPI.bulkReject(selectedIds, bulkRejectReason, bulkRemarks);
            const { success, failed } = res.results || { success: selectedIds, failed: [] };

            if (failed.length > 0) {
                toast.warning(`Rejected ${success.length} items, but ${failed.length} failed.`);
            } else {
                toast.success(`Successfully rejected ${success.length} items.`);
            }

            setBulkRejectOpen(false);
            setBulkRejectReason("");
            setBulkRemarks("");
            fetchPayments();
        } catch (err) {
            console.error("Bulk rejection failed:", err);
            toast.error(err.response?.data?.error || "Bulk rejection failed");
        } finally {
            setBulkLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    if (loading) return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
        </Box>
    );

    if (payments.length === 0) return (
        <Box sx={{ p: 4, textAlign: "center" }}>
            <Alert severity="info" icon={<Info size={20} />} sx={{ justifyContent: 'center' }}>
                No pending payments for your approval at this stage.
            </Alert>
        </Box>
    );

    return (
        <Box>
            {payments.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                indeterminate={selectedIds.length > 0 && selectedIds.length < payments.length}
                                checked={payments.length > 0 && selectedIds.length === payments.length}
                                onChange={handleSelectAll}
                            />
                        }
                        label={
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Select All ({payments.length})
                            </Typography>
                        }
                    />
                </Box>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: selectedIds.length > 0 ? 10 : 0 }}>
                {payments.map((payment) => (
                    <PaymentApprovalCard
                        key={payment.id}
                        payment={payment}
                        onUpdate={fetchPayments}
                        userRole={user?.role}
                        selectable={true}
                        selected={selectedIds.includes(payment.id)}
                        onSelect={handleSelectRow}
                    />
                ))}
            </Box>

            <BulkActionBar
                count={selectedIds.length}
                onApprove={handleBulkApprove}
                onReject={handleBulkReject}
                loading={bulkLoading}
            />

            {/* Bulk Reject Dialog */}
            <Dialog open={bulkRejectOpen} onClose={() => !bulkLoading && setBulkRejectOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Selected Payments ({selectedIds.length})</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            select
                            label="Rejection Reason"
                            required
                            fullWidth
                            value={bulkRejectReason}
                            onChange={(e) => setBulkRejectReason(e.target.value)}
                            SelectProps={{ native: true }}
                        >
                            <option value=""></option>
                            <option value="Invalid Proof">Invalid Proof</option>
                            <option value="Amount Mismatch">Amount Mismatch</option>
                            <option value="Duplicate Request">Duplicate Request</option>
                            <option value="Incorrect UTR">Incorrect UTR</option>
                            <option value="Other">Other</option>
                        </TextField>
                        <TextField
                            label="Additional Remarks"
                            multiline
                            rows={3}
                            fullWidth
                            value={bulkRemarks}
                            onChange={(e) => setBulkRemarks(e.target.value)}
                            placeholder="Provide more details for the rejection..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setBulkRejectOpen(false)} disabled={bulkLoading}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={submitBulkReject}
                        disabled={!bulkRejectReason || bulkLoading}
                    >
                        Reject All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
