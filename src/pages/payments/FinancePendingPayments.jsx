// src/pages/payments/FinancePendingPayments.jsx
import React, { useEffect, useState } from "react";
import { Box, Button, Typography, Alert } from "@mui/material";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PaymentApprovalCard from "../../components/PaymentApprovalCard";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { isAccountsUser } from "../../utils/accountsPermissions";
import { Info } from "lucide-react";

export default function FinancePendingPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getFinancePending();
      const paymentsList = res.payments || res.data || res || [];
      setPayments(Array.isArray(paymentsList) ? paymentsList : []);
      setHasAccess(true);
    } catch (e) {
      // 403 = not permitted for accounts_user (may be finance_admin only)
      // 404 = endpoint doesn't exist
      if (e?.response?.status === 403 || e?.response?.status === 404) {
        setHasAccess(false);
        setPayments([]);
        // Don't show error toast for permission issues
        return;
      }
      console.error("Failed to load payments:", e);
      toast.error("Failed to load pending payments");
      setHasAccess(true); // Assume access for other errors
    } finally {
      setLoading(false);
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
        <Typography variant="body2" color="text.secondary">
          {payments.length} payment(s) pending {isAccountsUser(user) ? "your" : "finance"} approval
        </Typography>
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {payments.map((payment) => (
            <PaymentApprovalCard
              key={payment.id}
              payment={payment}
              onUpdate={load}
              userRole={user?.role}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
