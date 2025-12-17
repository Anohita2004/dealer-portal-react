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
      const paymentsList = res.payments || res.data || res || [];
      setPayments(Array.isArray(paymentsList) ? paymentsList : []);
    } catch (e) {
      console.error("Failed to load payments:", e);
      toast.error("Failed to load pending payments");
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
          <Typography variant="body1" color="text.secondary">
            No pending payment requests from your staff
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
