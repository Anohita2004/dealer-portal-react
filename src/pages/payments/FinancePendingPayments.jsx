// src/pages/payments/FinancePendingPayments.jsx
import React, { useEffect, useState } from "react";
import { Box, Button, Typography, Alert } from "@mui/material";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PaymentApprovalCard from "../../components/PaymentApprovalCard";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { isAccountsUser } from "../../utils/accountsPermissions";
import { Info, CheckSquare, Square } from "lucide-react";
import BulkActionBar from "../../components/BulkActionBar";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel } from "@mui/material";

export default function FinancePendingPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkRemarks, setBulkRemarks] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      let res;
      const role = user?.role?.toLowerCase();

      console.log("[FinancePendingPayments] User role:", role);

      // Role-based endpoint selection
      if (role === "dealer_admin") {
        res = await paymentAPI.getDealerPending();
      } else if (role === "finance_admin" || role === "accounts_user") {
        res = await paymentAPI.getFinancePending();
        console.log("[FinancePendingPayments] Raw API response:", res);
      } else {
        // For manager roles (territory_manager, area_manager, regional_manager, regional_admin)
        // Try finance pending first, then filter by workflow stage
        try {
          res = await paymentAPI.getFinancePending();
        } catch (e) {
          // If finance pending fails, try dealer pending
          try {
            res = await paymentAPI.getDealerPending();
          } catch (e2) {
            // If both fail, user doesn't have access
            if (e2?.response?.status === 403 || e2?.response?.status === 404) {
              setHasAccess(false);
              setPayments([]);
              return;
            }
            throw e2;
          }
        }
      }

      let paymentsList = Array.isArray(res) ? res : res.pending || res.payments || res.data || res || [];

      console.log("[FinancePendingPayments] Extracted payments list:", paymentsList);
      console.log("[FinancePendingPayments] Payments count:", paymentsList.length);

      // For manager roles, filter by workflow stage
      if (["territory_manager", "area_manager", "regional_manager", "regional_admin"].includes(role)) {
        // Fetch workflow status for each payment and filter by current stage
        const filteredPayments = [];
        for (const payment of paymentsList) {
          try {
            const workflowRes = await paymentAPI.getWorkflowStatus(payment.id);
            const workflow = workflowRes.workflow || workflowRes.data || workflowRes;
            const currentStage = workflow?.currentStage || payment.approvalStage;

            // Map role to stage name
            const roleToStage = {
              territory_manager: "territory_manager",
              area_manager: "area_manager",
              regional_manager: "regional_manager",
              regional_admin: "regional_admin",
            };

            const userStage = roleToStage[role];
            if (currentStage === userStage && workflow?.approvalStatus === "pending") {
              filteredPayments.push(payment);
            }
          } catch (err) {
            // If workflow fetch fails, include payment if it's pending
            if (payment.status === "pending" || payment.approvalStatus === "pending") {
              filteredPayments.push(payment);
            }
          }
        }
        paymentsList = filteredPayments;
      }

      // For finance_admin, show ALL payments from the API without extra filtering
      // The backend should already filter to only show payments at finance stage

      console.log("[FinancePendingPayments] Final payments to display:", paymentsList.length);

      setPayments(Array.isArray(paymentsList) ? paymentsList : []);
      setSelectedIds([]); // Clear selection on reload
      setHasAccess(true);
    } catch (e) {
      console.error("[FinancePendingPayments] API Error:", e);
      console.error("[FinancePendingPayments] Error response:", e?.response?.data);
      if (e?.response?.status === 403 || e?.response?.status === 404) {
        setHasAccess(false);
        setPayments([]);
        return;
      }
      console.error("Failed to load payments:", e);
      toast.error("Failed to load pending payments");
      setHasAccess(true);
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

      load();
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
      load();
    } catch (err) {
      console.error("Bulk rejection failed:", err);
      toast.error(err.response?.data?.error || "Bulk rejection failed");
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reconcile = async () => {
    try {
      await paymentAPI.triggerReconcile();
      toast.success("Auto-reconciliation triggered");
      load();
    } catch (e) {
      console.error("Reconciliation failed:", e);
      toast.error("Failed to trigger reconciliation");
    }
  };

  // If accounts_user doesn't have access, show explanation
  if (!hasAccess && isAccountsUser(user)) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Payment Approvals"
          subtitle="Review and approve payment requests at your workflow stage"
        />
        <Alert severity="info" icon={<Info size={20} />} sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Access Restricted
          </Typography>
          <Typography variant="body2">
            Payment approvals are managed through the workflow system. You will see payments that require your approval based on your role and the current workflow stage.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={isAccountsUser(user) ? "Payment Approvals" : "Finance — Pending Payments"}
        subtitle={
          isAccountsUser(user)
            ? "Review and approve payment requests at your workflow stage. Verify amounts, proof documents, and provide mandatory remarks."
            : "Review and approve payment requests from dealers"
        }
      />

      {/* Accounts User Context */}
      {isAccountsUser(user) && (
        <Alert severity="info" icon={<Info size={20} />} sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Your Role: Payment Verification
          </Typography>
          <Typography variant="body2">
            As an Accounts user, you verify payments at the finance approval stage. Review invoice amounts, payment proof, and UTR numbers. Your approval/rejection with remarks is recorded in the audit trail.
          </Typography>
        </Alert>
      )}

      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {payments.length > 0 && (
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
          )}
          <Typography variant="body2" color="text.secondary">
            {payments.length} payment(s) pending {isAccountsUser(user) ? "your" : "finance"} approval
          </Typography>
        </Box>
        {!isAccountsUser(user) && (
          <Button variant="outlined" onClick={reconcile}>
            Trigger Auto-Reconcile
          </Button>
        )}
      </Box>

      {loading ? (
        <Typography>Loading payments...</Typography>
      ) : payments.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No pending payments for finance approval
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: selectedIds.length > 0 ? 10 : 0 }}>
          {payments.map((payment) => (
            <PaymentApprovalCard
              key={payment.id}
              payment={payment}
              onUpdate={load}
              userRole={user?.role}
              selectable={true}
              selected={selectedIds.includes(payment.id)}
              onSelect={handleSelectRow}
            />
          ))}
        </Box>
      )}

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
            loading={bulkLoading}
            disabled={!bulkRejectReason || bulkLoading}
          >
            Reject All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
