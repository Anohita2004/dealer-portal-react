// src/pages/payments/DealerAdminPayments.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PaymentApprovalCard from "../../components/PaymentApprovalCard";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";

export default function DealerAdminPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getDealerPending();
      // Handle different response structures: res.pending, res.payments, res.data, or direct array
      let paymentsList = Array.isArray(res) 
        ? res 
        : res.pending || res.payments || res.data || res || [];
      
      // Ensure it's an array
      paymentsList = Array.isArray(paymentsList) ? paymentsList : [];
      
      // Filter to only show pending payments at dealer_admin stage
      const filteredPayments = paymentsList.filter(payment => {
        // Check if payment is pending
        const isPending = payment.status === "pending" || 
                         payment.status === "dealer_admin_pending" ||
                         payment.approvalStatus === "pending" || 
                         payment.dealerApprovalStatus === "pending" ||
                         payment.status === "submitted";
        
        // Check if at dealer_admin stage
        const isDealerAdminStage = payment.approvalStage === "dealer_admin" || 
                                   !payment.approvalStage; // If no stage, assume it's for dealer admin
        
        return isPending && isDealerAdminStage;
      });
      
      setPayments(filteredPayments);
    } catch (e) {
      // 404/403 = endpoint doesn't exist or role restriction - handle gracefully
      if (e?.response?.status === 404 || e?.response?.status === 403) {
        setPayments([]);
        console.debug("Payment approvals endpoint not available or access denied");
        return;
      }
      console.error("Failed to load payments:", e);
      toast.error("Failed to load pending payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dealer Admin — Pending Payment Requests"
        subtitle="Review and approve payment requests from your staff"
      />

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {payments.length} payment request(s) pending your approval
        </Typography>
      </Box>

      {loading ? (
        <Typography>Loading payments...</Typography>
      ) : payments.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No pending payment requests from your staff
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "var(--font-size-sm)" }}>
            Payment requests created by your staff will appear here when they are at the dealer admin approval stage.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {payments.map((payment) => (
            <PaymentApprovalCard
              key={payment.id}
              payment={payment}
              onUpdate={load}
              userRole={user?.role || "dealer_admin"}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
