// src/pages/payments/DealerAdminPayments.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Button,
  Card,
  CardContent,
  Chip
} from "@mui/material";
import { Search, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { paymentAPI } from "../../services/api";
import { toast } from "react-toastify";
import PaymentApprovalCard from "../../components/PaymentApprovalCard";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getPaymentStatusDisplay } from "../../utils/paymentStatus";

export default function DealerAdminPayments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, blocked
  const [viewMode, setViewMode] = useState("approvals"); // list, approvals
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (viewMode === "approvals") {
        // For dealer admin, we use getDealerPending for approvals
        res = await paymentAPI.getDealerPending();
      } else {
        // For "All Payments" view, use getMyRequests
        res = await paymentAPI.getMyRequests();
      }

      let paymentsList = Array.isArray(res)
        ? res
        : res.pending || res.payments || res.data || res || [];

      paymentsList = Array.isArray(paymentsList) ? paymentsList : [];
      setPayments(paymentsList);
    } catch (e) {
      if (e?.response?.status !== 404 && e?.response?.status !== 403) {
        console.error("Failed to load payments:", e);
        toast.error("Failed to load payments");
      }
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [viewMode]);

  const filteredPayments = payments.filter(payment => {
    const status = (payment.status || "").toLowerCase();
    const approvalStatus = (payment.approvalStatus || "").toLowerCase();
    const dealerApproval = (payment.dealerApprovalStatus || "").toLowerCase();

    // Status Filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        const isPending = status === "pending" ||
          status === "dealer_admin_pending" ||
          approvalStatus === "pending" ||
          dealerApproval === "pending" ||
          status === "submitted";

        if (!isPending) return false;
      } else if (statusFilter === "approved") {
        const isApproved = status === "approved" || approvalStatus === "approved" || status === "finance_approval_pending";
        if (!isApproved) return false;
      } else if (statusFilter === "blocked") {
        const isBlocked = status === "rejected" || approvalStatus === "rejected" || status === "blocked";
        if (!isBlocked) return false;
      }
    }

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        payment.id?.toLowerCase().includes(query) ||
        payment.paymentNumber?.toLowerCase().includes(query) ||
        (payment.dealer?.businessName || payment.dealerName || "").toLowerCase().includes(query) ||
        (payment.invoiceNumber || payment.invoice?.invoiceNumber || "").toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Dealer Payments Approval"
        subtitle={viewMode === "approvals" ? "Review and approve pending staff payments" : "View and track all dealer payments"}
      />

      {/* View Mode Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={viewMode}
          onChange={(e, newValue) => setViewMode(newValue)}
        >
          <Tab label="All Dealer Payments" value="list" />
          <Tab label="Pending Approvals" value="approvals" />
        </Tabs>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search payments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <Tabs
          value={statusFilter}
          onChange={(e, newValue) => setStatusFilter(newValue)}
          sx={{ flex: 1 }}
        >
          <Tab label="All" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="Approved" value="approved" />
          <Tab label="Blocked" value="blocked" />
        </Tabs>

        <Button
          variant="outlined"
          size="small"
          onClick={load}
          startIcon={<RefreshCw size={16} />}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography color="text.secondary">Loading payments...</Typography>
        </Box>
      ) : filteredPayments.length === 0 ? (
        <Card sx={{ border: "1px dashed", borderColor: "divider", bgcolor: "background.default" }}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              No payments found matching your criteria.
            </Typography>
          </CardContent>
        </Card>
      ) : viewMode === "approvals" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredPayments.map((payment) => (
            <PaymentApprovalCard
              key={payment.id}
              payment={payment}
              onUpdate={load}
              userRole={user?.role || "dealer_admin"}
            />
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-subtle)" }}>
                    <th style={{ padding: "12px", textAlign: "left" }}>Payment #</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "left" }}>Invoice #</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Amount</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px" }}>{payment.paymentNumber || `#${payment.id?.slice(0, 8)}`}</td>
                      <td style={{ padding: "12px" }}>
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {payment.invoiceNumber || payment.invoice?.invoiceNumber || "N/A"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 600 }}>
                        ₹{Number(payment.amount || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {(() => {
                          const statusInfo = getPaymentStatusDisplay(payment, payment.workflow);
                          return (
                            <Chip
                              label={statusInfo.label.toUpperCase()}
                              size="small"
                              color={statusInfo.color}
                              icon={
                                statusInfo.icon === "success" ? <CheckCircle size={14} /> :
                                  (statusInfo.icon === "error") ? <XCircle size={14} /> : <Clock size={14} />
                              }
                            />
                          );
                        })()}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/payments/${payment.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
